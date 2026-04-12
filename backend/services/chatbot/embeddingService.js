const HF_BASE_URL =
  process.env.HUGGINGFACE_API_BASE_URL ||
  "https://api-inference.huggingface.co/models";

const MINILM_MODEL =
  process.env.HF_MINILM_MODEL || "sentence-transformers/all-MiniLM-L6-v2";

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

function normalizeEmbedding(raw) {
  if (!Array.isArray(raw)) return null;

  if (Array.isArray(raw[0])) {
    const vector = raw[0].map((value) => Number(value));
    return vector.every((value) => Number.isFinite(value)) ? vector : null;
  }

  const vector = raw.map((value) => Number(value));
  return vector.every((value) => Number.isFinite(value)) ? vector : null;
}

async function requestTextEmbedding(model, text) {
  const apiKey = getHuggingFaceApiKey();
  const response = await fetch(`${HF_BASE_URL}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: String(text || "").trim(),
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(`HF embedding request failed (${response.status}): ${errorText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const embedding = normalizeEmbedding(data);

  if (!embedding) {
    throw new Error(`HF model '${model}' did not return a valid embedding`);
  }

  return embedding;
}

function normalizeForPrompt(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function getProductSearchText(product) {
  return [
    product?.name,
    product?.brand,
    product?.categoryName,
    product?.description,
  ]
    .filter(Boolean)
    .map((value) => normalizeForPrompt(value))
    .join(" | ");
}

async function getMiniLmEmbedding(text) {
  return requestTextEmbedding(MINILM_MODEL, text);
}

module.exports = {
  getMiniLmEmbedding,
  getProductSearchText,
};
