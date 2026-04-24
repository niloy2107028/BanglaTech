const MAX_HISTORY = 6;
const REQUEST_TIMEOUT_MS = 25000;
const { chatbotConfig } = require("../../config/chatbotConfig");

const DEFAULT_MODEL = "Qwen/Qwen3-VL-8B-Instruct";
const FALLBACK_MODEL = "Qwen/Qwen2.5-7B-Instruct";
const GENERAL_PRIMARY_MODEL = "Qwen/Qwen3-VL-8B-Instruct";
const HF_CHAT_URL =
  process.env.HUGGINGFACE_CHAT_URL ||
  "https://router.huggingface.co/v1/chat/completions";

function getHuggingFaceApiKey() {
  const key =
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HF_API_KEY ||
    process.env.HF_TOKEN ||
    "";

  if (!key) {
    throw new Error(
      "HUGGINGFACE_API_KEY (or HF_API_KEY / HF_TOKEN) is not configured",
    );
  }

  return key;
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY)
    .filter((item) => item && item.role && item.content)
    .map((item) => ({ role: item.role, content: String(item.content) }));
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
    } catch (err) {
      return null;
    }
  }
}

function normalizeIntent(value) {
  const intent = String(value || "general").toLowerCase();
  if (["search", "recommendation", "compare", "explain", "general"].includes(intent)) return intent;
  return "general";
}

function normalizeQueryMode(value) {
  const mode = String(value || "auto").toLowerCase();
  if (["fresh", "contextual", "auto"].includes(mode)) return mode;
  return "auto";
}

function normalizeAction(value) {
  const action = String(value || "reply_from_context").toLowerCase();
  if (["search", "reply_from_context", "clarify"].includes(action)) return action;
  return "reply_from_context";
}

function normalizeShortText(value, maxLength = 80) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizeStringArray(values, maxItems = 8) {
  if (!Array.isArray(values)) return [];

  return Array.from(new Set(
    values
      .map((value) => normalizeShortText(value, 40).toLowerCase())
      .filter(Boolean),
  )).slice(0, maxItems);
}

async function requestRouterChat({ apiKey, model, payload, signal }) {
  const response = await fetch(HF_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF chat failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`HF chat empty response for model ${model}`);
  }

  return { content: String(content).trim() };
}

async function createWithPreferredModels(payloadBuilder, preferredModels = []) {
  const apiKey = getHuggingFaceApiKey();
  const models = Array.from(new Set(preferredModels.filter(Boolean)));
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const payload = payloadBuilder(model);
      return await requestRouterChat({
        apiKey,
        model,
        payload,
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Hugging Face chat request failed");
}

async function createWithFallback(payloadBuilder) {
  return createWithPreferredModels(payloadBuilder, [
    process.env.HF_CHAT_MODEL || DEFAULT_MODEL,
    FALLBACK_MODEL,
  ]);
}

async function parseIntentAndQuery({ message, history, categories = [], hasShownProducts = false }) {
  const allowedCategories = Array.isArray(categories)
    ? categories.map((item) => normalizeShortText(item, 60)).filter(Boolean).slice(0, 80)
    : [];

  const categoryListText = allowedCategories.length > 0
    ? `Allowed categories (must choose from this list only): ${JSON.stringify(allowedCategories)}`
    : "Allowed categories list unavailable. Return category as empty string when unsure.";

  const prompt = `You are a product understanding assistant for an e-commerce store.
Return ONLY valid JSON with this exact shape:
{"needs_search":true,"mode":"fresh|contextual|casual","product_title":"string|null","product_description":"string|null","category":"string|null","clarification_needed":"string|null"}
Rules:
- needs_search=true when user is asking to find/discover products.
- needs_search=false for casual chat or when answer should come from existing conversation context.
- If hasShownProducts is false, do NOT treat vague follow-up as contextual product reasoning.
- mode=fresh for new product lookup.
- mode=contextual for follow-up over already shown products.
- mode=casual for greeting/small talk/non-shopping.
- category must be exactly one category from list or null.
- clarification_needed should be one short question only if user input is too vague.
- Never include markdown.
${categoryListText}`;

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: prompt },
      {
        role: "system",
        content: `Context signal: hasShownProducts=${Boolean(hasShownProducts)}.`,
      },
      ...safeHistory(history),
      { role: "user", content: String(message || "") },
    ],
    temperature: 0,
    max_tokens: 120,
  }));

  const raw = completion?.content || "";
  const parsed = parseJsonSafely(raw) || {};

  const fallbackQuery = String(message || "").trim().slice(0, 120);
  const parsedCategory = normalizeShortText(parsed.category || "", 60);
  const category = allowedCategories.length > 0
    ? (allowedCategories.find((item) => item.toLowerCase() === parsedCategory.toLowerCase()) || "")
    : parsedCategory;

  const mode = String(parsed.mode || "casual").toLowerCase();
  const safeMode = ["fresh", "contextual", "casual"].includes(mode) ? mode : "casual";
  const needsSearch = Boolean(parsed.needs_search);
  const productTitle = normalizeShortText(parsed.product_title || "", 90);
  const productDescription = normalizeShortText(parsed.product_description || "", 180);
  const clarificationNeeded = normalizeShortText(parsed.clarification_needed || "", 180);

  const query = [productTitle, productDescription, fallbackQuery]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .trim();

  const action = clarificationNeeded
    ? "clarify"
    : needsSearch
      ? "search"
      : "reply_from_context";

  const intent = needsSearch ? "search" : "general";
  const queryMode = safeMode === "contextual" ? "contextual" : safeMode === "fresh" ? "fresh" : "auto";

  return {
    needsSearch,
    mode: safeMode,
    productTitle,
    productDescription,
    clarificationNeeded,
    action,
    clarifyQuestion: clarificationNeeded,
    intent: normalizeIntent(intent),
    queryMode: normalizeQueryMode(queryMode),
    query: normalizeShortText(query || fallbackQuery, 120),
    category,
    categoryConfidence: 0,
    probableProductName: productTitle,
    probableBrand: "",
    preferredKeywords: [],
    avoidKeywords: [],
    budgetMax: null,
    mustInStock: false,
    priceMin: null,
    priceMax: null,
  };
}

async function generateFlowReply({ message, history, parsed, products = [] }) {
  const safeProducts = Array.isArray(products)
    ? products.slice(0, 8).map((product) => ({
      id: String(product?._id || product?.id || ""),
      name: String(product?.name || ""),
      categoryName: String(product?.categoryName || ""),
      description: String(product?.description || ""),
      price: Number(product?.price || 0),
      inStock: Boolean(product?.inStock),
      rating: Number(product?.rating || 0),
    }))
    : [];

const prompt = `You are a friendly e-commerce shopping assistant.
Rules:
1) If clarification is needed, ask that one short question politely.
2) If products are provided, use ONLY those products.
3) When products are provided, write only a short conversational summary (1-3 lines) and do not list every product one by one.
4) If products are empty but search was needed, apologize briefly and suggest a better query.
5) If search was not needed, reply naturally from chat history.
6) Never invent product details.
7) Reply in the same language style as the user.`;

  const payload = {
    userMessage: String(message || ""),
    parsed: {
      needsSearch: Boolean(parsed?.needsSearch),
      mode: String(parsed?.mode || "casual"),
      productTitle: String(parsed?.productTitle || ""),
      productDescription: String(parsed?.productDescription || ""),
      category: String(parsed?.category || ""),
      clarificationNeeded: String(parsed?.clarificationNeeded || ""),
    },
    products: safeProducts,
  };

  const completion = await createWithPreferredModels(
    (model) => ({
      model,
      messages: [
        { role: "system", content: prompt },
        ...safeHistory(history),
        { role: "user", content: JSON.stringify(payload) },
      ],
      temperature: 0.3,
      max_tokens: 340,
    }),
    [
      process.env.HF_GENERAL_CHAT_MODEL || GENERAL_PRIMARY_MODEL,
      process.env.HF_CHAT_MODEL || DEFAULT_MODEL,
      FALLBACK_MODEL,
    ],
  );

  return String(completion?.content || "").trim();
}

async function disambiguateWithHistory({ message, history, parsed, hasShownProducts = false }) {
  const currentParsed = {
    action: normalizeAction(parsed?.action || "reply_from_context"),
    intent: normalizeIntent(parsed?.intent || "general"),
    queryMode: normalizeQueryMode(parsed?.queryMode || "auto"),
    category: normalizeShortText(parsed?.category || "", 60),
    probableProductName: normalizeShortText(parsed?.probableProductName || "", 80),
    probableBrand: normalizeShortText(parsed?.probableBrand || "", 40),
  };

  const prompt = `You are classifying whether the user's latest message is a follow-up about already shown products or a fresh catalog search.
Return ONLY valid JSON with shape:
{"action":"search|reply_from_context|clarify","queryMode":"fresh|contextual|auto","intent":"search|recommendation|compare|explain|general"}
Rules:
- Prefer action=reply_from_context when user likely refers to previously shown products in history.
- Use action=search only when user clearly asks new product lookup/search.
- Use action=clarify when intent is ambiguous.
- If hasShownProducts is false, do NOT use action=reply_from_context.
- Prefer queryMode=contextual when user likely refers to products already discussed in history.
- Use queryMode=fresh only when user clearly starts a new topic/product request.
- Keep intent aligned with user goal: compare/recommendation/explain for follow-up reasoning; search for new lookup.
- Do not invent details.
- Never include markdown.`;

  const payload = {
    userMessage: String(message || ""),
    currentParsed,
    recentHistory: safeHistory(history),
  };

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: prompt },
      {
        role: "system",
        content: `Context signal: hasShownProducts=${Boolean(hasShownProducts)}.`,
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
    temperature: 0,
    max_tokens: 90,
  }));

  const parsedJson = parseJsonSafely(completion?.content || "") || {};
  return {
    action: normalizeAction(parsedJson.action || currentParsed.action),
    intent: normalizeIntent(parsedJson.intent || currentParsed.intent),
    queryMode: normalizeQueryMode(parsedJson.queryMode || currentParsed.queryMode),
  };
}

async function generateGeneralReply({ message, history }) {
  const systemPrompt = `You are ${chatbotConfig.botName}, a reliable e-commerce assistant.
Rules:
1) Never invent product names, prices, or stock.
2) If user needs product details, ask them to search products.
3) Keep answers concise and in user's language.
4) Be helpful for general questions, policies, and guidance.`;

  const completion = await createWithPreferredModels(
    (model) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...safeHistory(history),
        { role: "user", content: String(message || "") },
      ],
      temperature: 0.4,
      max_tokens: 300,
    }),
    [
      process.env.HF_GENERAL_CHAT_MODEL || GENERAL_PRIMARY_MODEL,
      process.env.HF_CHAT_MODEL || DEFAULT_MODEL,
      FALLBACK_MODEL,
    ],
  );

  return String(completion?.content || "").trim();
}

async function generateProductExplanation({ message, history, products }) {
  const safeProducts = Array.isArray(products)
    ? products.slice(0, 4).map((product) => ({
      name: String(product?.name || ""),
      brand: String(product?.brand || ""),
      categoryName: String(product?.categoryName || ""),
      price: Number(product?.price || 0),
      description: String(product?.description || ""),
      specifications: product?.specifications || {},
      inStock: Boolean(product?.inStock),
    }))
    : [];

  const systemPrompt = `You are ${chatbotConfig.botName}.
Task: Explain matched products in a practical, user-friendly way.
Rules:
1) Use ONLY the provided products JSON. Do not hallucinate anything.
2) For each relevant product, explain what it is used for and who it is best for.
3) Keep response concise, readable, and in the user's language.
4) If no products, clearly say item is not available now.
5) Do not use markdown tables.`;

  const userPayload = {
    userMessage: String(message || ""),
    products: safeProducts,
  };

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...safeHistory(history),
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    temperature: 0.3,
    max_tokens: 420,
  }));

  return String(completion?.content || "").trim();
}

async function generateProductComparison({ message, history, products }) {
  const safeProducts = Array.isArray(products)
    ? products.slice(0, 4).map((product) => ({
      name: String(product?.name || ""),
      brand: String(product?.brand || ""),
      categoryName: String(product?.categoryName || ""),
      price: Number(product?.price || 0),
      rating: Number(product?.rating || 0),
      reviews: Number(product?.reviews || 0),
      description: String(product?.description || ""),
      specifications: product?.specifications || {},
      inStock: Boolean(product?.inStock),
    }))
    : [];

  const systemPrompt = `You are ${chatbotConfig.botName}.
Task: Compare products using ONLY provided JSON.
Rules:
1) Never invent specs, prices, stock, age suitability, or features that are not present.
2) Be question-aware: prioritize exactly what user asked (budget, age fit, durability, performance, value).
3) Keep answer concise but thoughtful (6-10 lines max), plain text, no markdown headings.
4) End with one clear recommendation and one short reason.
5) If important data is missing, say that explicitly.`;

  const userPayload = {
    userMessage: String(message || ""),
    products: safeProducts,
  };

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...safeHistory(history),
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    temperature: 0.3,
    max_tokens: 520,
  }));

  return String(completion?.content || "").trim();
}

async function extractDecisionSignals({ message, history }) {
  const prompt = `Extract purchase decision signals from user message.
Return ONLY valid JSON with shape:
{"intentHint":"search|recommendation|compare|explain|general","preferredKeywords":["string"],"avoidKeywords":["string"],"budgetMax":number|null}
Rules:
1) Detect negation correctly (e.g., user does not like X => avoidKeywords includes X).
2) Keep keyword arrays short and normalized lowercase.
3) budgetMax must be number or null.
4) Do not add explanation text.`;

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: prompt },
      ...safeHistory(history),
      { role: "user", content: String(message || "") },
    ],
    temperature: 0,
    max_tokens: 180,
  }));

  const parsed = parseJsonSafely(completion?.content || "") || {};

  const safeIntent = normalizeIntent(parsed.intentHint || "general");
  const preferredKeywords = Array.isArray(parsed.preferredKeywords)
    ? parsed.preferredKeywords
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8)
    : [];

  const avoidKeywords = Array.isArray(parsed.avoidKeywords)
    ? parsed.avoidKeywords
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8)
    : [];

  const budgetMaxValue = Number(parsed.budgetMax);
  const budgetMax = Number.isFinite(budgetMaxValue) && budgetMaxValue > 0
    ? budgetMaxValue
    : null;

  return {
    intentHint: safeIntent,
    preferredKeywords,
    avoidKeywords,
    budgetMax,
  };
}

async function generateRecommendationDecision({ message, history, products }) {
  const safeProducts = Array.isArray(products)
    ? products.slice(0, 6).map((product) => ({
      id: String(product?._id || product?.id || ""),
      name: String(product?.name || ""),
      categoryName: String(product?.categoryName || ""),
      price: Number(product?.price || 0),
      rating: Number(product?.rating || 0),
      reviews: Number(product?.reviews || 0),
      inStock: Boolean(product?.inStock),
      description: String(product?.description || ""),
    }))
    : [];

  const prompt = `You are ${chatbotConfig.botName}.
Choose one best product from provided JSON for the user message.
Return ONLY JSON with shape:
{"recommendedName":"string","reason":"string"}
Rules:
1) Use only provided products.
2) Respect user constraints (budget, dislikes, intended person).
3) Keep reason concise (1-2 lines).
4) If no suitable product, return recommendedName empty string with reason.`;

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: prompt },
      ...safeHistory(history),
      {
        role: "user",
        content: JSON.stringify({
          userMessage: String(message || ""),
          products: safeProducts,
        }),
      },
    ],
    temperature: 0.2,
    max_tokens: 220,
  }));

  const parsed = parseJsonSafely(completion?.content || "") || {};
  return {
    recommendedName: String(parsed.recommendedName || "").trim(),
    reason: String(parsed.reason || "").trim(),
  };
}

async function generateRecommendationReply({ message, history, products }) {
  const safeProducts = Array.isArray(products)
    ? products.slice(0, 6).map((product) => ({
      name: String(product?.name || ""),
      categoryName: String(product?.categoryName || ""),
      price: Number(product?.price || 0),
      rating: Number(product?.rating || 0),
      reviews: Number(product?.reviews || 0),
      inStock: Boolean(product?.inStock),
      description: String(product?.description || ""),
      specifications: product?.specifications || {},
    }))
    : [];

  const systemPrompt = `You are ${chatbotConfig.botName}.
Task: Recommend ONE best product from provided JSON.
Rules:
1) Use only provided products.
2) Respect user constraints from message/history.
3) Keep answer concise: 3-5 lines.
4) End with one clear recommendation and reason.
5) If no suitable product, say so clearly.`;

  const completion = await createWithFallback((model) => ({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...safeHistory(history),
      {
        role: "user",
        content: JSON.stringify({ userMessage: String(message || ""), products: safeProducts }),
      },
    ],
    temperature: 0.3,
    max_tokens: 260,
  }));

  return String(completion?.content || "").trim();
}

module.exports = {
  disambiguateWithHistory,
  extractDecisionSignals,
  generateFlowReply,
  generateRecommendationDecision,
  generateRecommendationReply,
  parseIntentAndQuery,
  generateGeneralReply,
  generateProductExplanation,
  generateProductComparison,
};
