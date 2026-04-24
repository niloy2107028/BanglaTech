const { OpenAI } = require("openai");

const HF_ROUTER_BASE_URL = "https://router.huggingface.co/v1";
const HF_IMAGE_MODEL = process.env.HF_IMAGE_MODEL || "Qwen/Qwen3-VL-8B-Instruct:novita";
const HF_IMAGE_PARSER_MODEL = process.env.HF_IMAGE_PARSER_MODEL || "MiniMaxAI/MiniMax-M2.5";

const IMAGE_CAPTION_SYSTEM_PROMPT =
  "You are an image description assistant. Your ONLY job is to describe what you see in the image - the product, its color, style, brand if visible, and physical features. Do NOT answer any questions. Do NOT say whether something is available. Just describe the image in 2-3 sentences.";

function getHfApiKey() {
  const key =
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HF_API_KEY ||
    process.env.HF_TOKEN ||
    "";

  if (!key || !String(key).trim()) {
    throw new Error("Missing Hugging Face API key. Set HUGGINGFACE_API_KEY (or HF_API_KEY / HF_TOKEN) in .env.");
  }

  return String(key).trim();
}

function buildImageDataUrl(file) {
  const mimeType = String(file?.mimetype || "").trim();
  const raw = file?.buffer;

  if (!raw || !Buffer.isBuffer(raw) || raw.length === 0) {
    throw new Error("Invalid image file payload");
  }

  if (!mimeType.startsWith("image/")) {
    throw new Error("Unsupported image mime type");
  }

  return `data:${mimeType};base64,${raw.toString("base64")}`;
}

function extractCaption(message) {
  const content = message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const textPart = content.find((part) => part?.type === "text" && typeof part?.text === "string");
    if (textPart?.text) return textPart.text.trim();
  }

  return "";
}

function parseJsonSafely(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch (innerError) {
      return null;
    }
  }
}

function toShortText(value, maxLength = 80) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function toStringArray(input, max = 8) {
  if (!Array.isArray(input)) return [];

  return Array.from(
    new Set(
      input
        .map((item) => toShortText(item, 40).toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, max);
}

function safeHistory(history, maxItems = 8) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-maxItems)
    .map((item) => ({
      role: String(item?.role || "user"),
      content: String(item?.content || ""),
      products: Array.isArray(item?.products) ? item.products.slice(0, 4) : [],
    }));
}

async function extractImageSearchSignals(client, { caption, categories = [] }) {
  const allowedCategories = Array.isArray(categories)
    ? categories.map((item) => toShortText(item, 60)).filter(Boolean).slice(0, 80)
    : [];

  const categoryListText = allowedCategories.length > 0
    ? `Allowed categories (must choose from this list only): ${JSON.stringify(allowedCategories)}`
    : "Allowed categories list unavailable. Return probableCategory as empty string when unsure.";

  const parserPrompt = `Extract ecommerce search entities from an image caption.
Return ONLY valid JSON with this exact shape:
{
  "probableProductName":"string",
  "probableCategory":"string",
  "probableBrand":"string",
  "keywords":["string"],
  "attributes":["string"]
}
Rules:
- probableCategory must be one value from allowed categories list or empty string
- keep strings concise and lowercase where natural
- no markdown, no extra text
${categoryListText}`;

  const completion = await client.chat.completions.create({
    model: HF_IMAGE_PARSER_MODEL,
    messages: [
      { role: "system", content: parserPrompt },
      {
        role: "user",
        content: JSON.stringify({
          caption: String(caption || ""),
        }),
      },
    ],
    temperature: 0,
    max_tokens: 220,
  });

  const raw = extractCaption(completion?.choices?.[0]?.message);
  const parsed = parseJsonSafely(raw) || {};

  const parsedCategory = toShortText(parsed?.probableCategory, 60);
  const probableCategory = allowedCategories.length > 0
    ? (allowedCategories.find((item) => item.toLowerCase() === parsedCategory.toLowerCase()) || "")
    : parsedCategory;

  return {
    probableProductName: toShortText(parsed?.probableProductName, 80),
    probableCategory,
    probableBrand: toShortText(parsed?.probableBrand, 40),
    keywords: toStringArray(parsed?.keywords, 10),
    attributes: toStringArray(parsed?.attributes, 10),
  };
}

function isNonProductQuestionPrompt(prompt) {
  const text = String(prompt || "").toLowerCase().trim();
  if (!text) return true;

  const nonProductPatterns = [
    /\bis\s+this\s+(type\s+of\s+)?product\s+available\b/,
    /\bis\s+it\s+available\b/,
    /\bavailable\??$/,
    /\bexplain\s+this\b/,
    /\bwhat\s+is\s+this\b/,
    /\bdescribe\s+this\b/,
  ];

  return nonProductPatterns.some((pattern) => pattern.test(text));
}

function buildCompactSearchQuery(prompt, entities, caption = "") {
  const cleanPrompt = String(prompt || "").trim();
  const useOnlyCaption = !cleanPrompt || isNonProductQuestionPrompt(cleanPrompt);

  const chunks = [
    toShortText(caption, 120),
    ...(useOnlyCaption ? [] : [toShortText(cleanPrompt, 80)]),
    entities.probableProductName,
    entities.probableCategory,
    entities.probableBrand,
    ...(Array.isArray(entities.keywords) ? entities.keywords : []),
    ...(Array.isArray(entities.attributes) ? entities.attributes : []),
  ].filter(Boolean);

  const normalizedTokens = chunks
    .join(" ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 14);

  const uniqueTokens = Array.from(new Set(normalizedTokens));
  return uniqueTokens.join(" ").trim();
}

async function requestImageCaption(file, userPrompt, options = {}) {
  const prompt = String(userPrompt || "").trim();
  const imageDataUrl = buildImageDataUrl(file);

  const client = new OpenAI({
    baseURL: HF_ROUTER_BASE_URL,
    apiKey: getHfApiKey(),
  });

  const completion = await client.chat.completions.create({
    model: HF_IMAGE_MODEL,
    messages: [
      {
        role: "system",
        content: IMAGE_CAPTION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 80,
  });

  const caption = extractCaption(completion?.choices?.[0]?.message);
  if (!caption) {
    throw new Error("No caption generated for image");
  }

  let entities;
  try {
    entities = await extractImageSearchSignals(client, {
      caption,
      categories: Array.isArray(options?.categories) ? options.categories : [],
    });
  } catch (error) {
    entities = {
      probableProductName: "",
      probableCategory: "",
      probableBrand: "",
      keywords: [],
      attributes: [],
    };
  }

  const searchQuery = buildCompactSearchQuery(prompt, entities, caption);

  return {
    caption,
    model: HF_IMAGE_MODEL,
    parserModel: HF_IMAGE_PARSER_MODEL,
    entities,
    searchQuery,
  };
}

async function detectImageIntent({ prompt, history, caption }) {
  const client = new OpenAI({
    baseURL: HF_ROUTER_BASE_URL,
    apiKey: getHfApiKey(),
  });

  const systemPrompt = `You are an intent router for image-based shopping chat.
Return ONLY valid JSON:
{"intent":"search|explain|compare|recommend|followup|greet"}

Intent rules:
- search: User wants to find a new product
- explain: User wants the image or a product described
- compare: User wants to compare two products they have already seen
- recommend: User wants a suggestion on which product to buy
- followup: User asks something about already shown products (price, size, availability)
- greet: General conversation, not product related

Never include markdown or extra keys.`;

  const payload = {
    userMessage: String(prompt || ""),
    imageCaption: String(caption || ""),
    history: safeHistory(history),
  };

  const completion = await client.chat.completions.create({
    model: HF_IMAGE_PARSER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
    temperature: 0,
    max_tokens: 60,
  });

  const raw = extractCaption(completion?.choices?.[0]?.message);
  const parsed = parseJsonSafely(raw) || {};
  const intent = String(parsed?.intent || "search").toLowerCase();

  if (["search", "explain", "compare", "recommend", "followup", "greet"].includes(intent)) {
    return intent;
  }

  return "search";
}

async function generateHistoryIntentReply({ prompt, products }) {
  const client = new OpenAI({
    baseURL: HF_ROUTER_BASE_URL,
    apiKey: getHfApiKey(),
  });

  const productDetails = Array.isArray(products)
    ? products.map((item) => ({
      id: String(item?._id || item?.id || ""),
      name: String(item?.name || ""),
      brand: String(item?.brand || ""),
      categoryName: String(item?.categoryName || ""),
      price: Number(item?.price || 0),
      description: String(item?.description || ""),
      inStock: Boolean(item?.inStock),
      rating: Number(item?.rating || 0),
    }))
    : [];

  const systemPrompt = `You are a shopping assistant. The user is asking about products they have already seen.
Based only on the product details provided below, answer the user's question.
Do not mention products that are not in the list below.

Products:
{product details here}

User question: {user message}`;

  const completion = await client.chat.completions.create({
    model: HF_IMAGE_PARSER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          products: productDetails,
          userQuestion: String(prompt || ""),
        }),
      },
    ],
    temperature: 0.3,
    max_tokens: 260,
  });

  return String(extractCaption(completion?.choices?.[0]?.message) || "").trim();
}

module.exports = {
  detectImageIntent,
  generateHistoryIntentReply,
  requestImageCaption,
};
