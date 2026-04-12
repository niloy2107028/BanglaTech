const { ChromaClient } = require("chromadb");

const CHROMA_URL = process.env.CHROMA_URL || "http://127.0.0.1:8000";
const MINILM_COLLECTION =
  process.env.CHROMA_MINILM_COLLECTION || "banglamart_minilm_products";

let client = null;
let minilmCollection = null;
let chromaAvailable = null;

function getClient() {
  if (!client) {
    client = new ChromaClient({ path: CHROMA_URL });
  }
  return client;
}

async function isChromaAvailable() {
  if (chromaAvailable === false) return false;

  const endpoints = [
    `${CHROMA_URL}/api/v2/heartbeat`,
    `${CHROMA_URL}/api/v1/heartbeat`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) {
        chromaAvailable = true;
        return true;
      }
    } catch (error) {
      // Try next endpoint.
    }
  }

  chromaAvailable = false;
  return false;
}

async function getOrCreateCollection(name) {
  if (!(await isChromaAvailable())) {
    return null;
  }

  const chroma = getClient();
  try {
    return await chroma.getOrCreateCollection({ name });
  } catch (error) {
    chromaAvailable = false;
    return null;
  }
}

async function getMiniLmCollection() {
  if (!minilmCollection) {
    minilmCollection = await getOrCreateCollection(MINILM_COLLECTION);
  }
  return minilmCollection;
}

function toId(product) {
  return String(product?._id || product?.id || "").trim();
}

function productMetadata(product) {
  return {
    productId: toId(product),
    name: String(product?.name || ""),
    brand: String(product?.brand || ""),
    categoryName: String(product?.categoryName || ""),
    price: Number(product?.price || 0),
    inStock: Boolean(product?.inStock),
  };
}

async function upsertMiniLmVectors({ products, vectors, documents }) {
  const collection = await getMiniLmCollection();
  if (!collection) return;

  const ids = products.map((product) => toId(product));
  const metadatas = products.map((product) => productMetadata(product));

  await collection.upsert({
    ids,
    embeddings: vectors,
    documents,
    metadatas,
  });
}

function mapQueryResult(result) {
  const ids = result?.ids?.[0] || [];
  const distances = result?.distances?.[0] || [];

  return ids.map((id, index) => ({
    id: String(id),
    distance: Number(distances[index] || 0),
  }));
}

async function queryMiniLm({ embedding, nResults = 12 }) {
  const collection = await getMiniLmCollection();
  if (!collection) return [];

  const result = await collection.query({
    queryEmbeddings: [embedding],
    nResults,
  });
  return mapQueryResult(result);
}

module.exports = {
  queryMiniLm,
  upsertMiniLmVectors,
};
