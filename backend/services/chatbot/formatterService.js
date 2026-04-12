const { chatbotConfig } = require("../../config/chatbotConfig");

function escapeMarkdown(text) {
  return String(text || "").replace(/([\\`*_{}\[\]()#+\-.!])/g, "\\$1");
}

function formatProductCard(product, baseUrl) {
  const safeName = escapeMarkdown(product.name);
  const shortDescription = escapeMarkdown(firstSentence(product.description));
  const productId = String(product?._id || product?.id || "").trim();
  const productLink = productId
    ? `${baseUrl}/product/${encodeURIComponent(productId)}`
    : `${baseUrl}${chatbotConfig.searchPagePath}?q=${encodeURIComponent(product.name)}`;

  return `**${safeName}**\nPrice: ${chatbotConfig.currencySymbol}${product.price}\nAbout: ${shortDescription}\n![${safeName}](${product.image})\n[View Product](${productLink})\n---`;
}

function buildProductCardPayload(product, baseUrl) {
  const productId = String(product?._id || product?.id || "").trim();
  const productUrl = productId
    ? `${baseUrl}/product/${encodeURIComponent(productId)}`
    : `${baseUrl}${chatbotConfig.searchPagePath}?q=${encodeURIComponent(product?.name || "")}`;

  return {
    productId: productId || null,
    name: String(product?.name || "Product"),
    price: Number(product?.price || 0),
    currencySymbol: chatbotConfig.currencySymbol,
    description: firstSentence(product?.description),
    image: String(product?.image || ""),
    category: String(product?.categoryName || "general"),
    rating: Number(product?.rating || 0),
    reviews: Number(product?.reviews || 0),
    inStock: Boolean(product?.inStock),
    url: productUrl,
  };
}

function buildProductCardsPayload(products, baseUrl, limit = 8) {
  if (!Array.isArray(products) || products.length === 0) return [];

  const seen = new Set();
  const uniqueProducts = [];
  for (const product of products) {
    const id = String(product?._id || product?.id || "").trim();
    const key = id || String(product?.name || "").toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueProducts.push(product);
    if (uniqueProducts.length >= limit) break;
  }

  return uniqueProducts.map((product) => buildProductCardPayload(product, baseUrl));
}

function parseBudgetFromMessage(message) {
  const text = String(message || "").toLowerCase();
  const match = text.match(/\b(\d{2,7})\b/);
  if (match) return Number(match[1]);
  return null;
}

function tokenizeForRelevance(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
    .slice(0, 20);
}

function scoreProductGenerally(product, message) {
  const price = Number(product?.price || 0);
  const rating = Number(product?.rating || 0);
  const reviews = Number(product?.reviews || 0);
  const budget = parseBudgetFromMessage(message);

  const productText = [
    product?.name,
    product?.brand,
    product?.categoryName,
    product?.description,
    JSON.stringify(product?.specifications || {}),
  ]
    .join(" ")
    .toLowerCase();

  const terms = tokenizeForRelevance(message);
  let relevanceHits = 0;
  for (const term of terms) {
    if (productText.includes(term)) relevanceHits += 1;
  }

  let score = 0;
  score += rating * 10;
  score += Math.min(reviews, 300) / 15;
  score += relevanceHits * 8;
  if (product?.inStock) score += 5;

  if (budget !== null) {
    if (price <= budget) {
      score += 18;
      const remaining = budget - price;
      score += Math.min(remaining / 200, 8);
    } else {
      score -= Math.min((price - budget) / 150, 15);
    }
  }

  return score;
}

function dedupeProducts(products) {
  if (!Array.isArray(products)) return [];
  const seen = new Set();
  const unique = [];

  for (const product of products) {
    const id = String(product?._id || product?.id || "").trim();
    const name = String(product?.name || "").trim().toLowerCase();
    const key = id || name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

function formatProductSearchSummary(products, message) {
  const total = Array.isArray(products) ? products.length : 0;
  if (total === 0) return formatNoResultsMessage();

  return `I found ${total} matching product${total > 1 ? "s" : ""} for you.`;
}

function formatComparisonFromProducts(products, message) {
  const candidates = dedupeProducts(products).slice(0, 4);
  if (candidates.length === 0) return formatNoResultsMessage();
  if (candidates.length === 1) {
    const only = candidates[0];
    return `Only one product is available to compare right now: ${only?.name || "Product"}. Price: ${chatbotConfig.currencySymbol}${Number(only?.price || 0)}.`;
  }

  const [first, second] = candidates;
  const budget = parseBudgetFromMessage(message);
  const ranked = [...candidates]
    .map((item) => ({ item, score: scoreProductGenerally(item, message) }))
    .sort((a, b) => b.score - a.score);

  const recommended = ranked[0]?.item || candidates[0];

  const other = recommended === first ? second : first;
  const firstPrice = Number(first?.price || 0);
  const secondPrice = Number(second?.price || 0);

  const lines = [
    `Quick comparison between ${first?.name || "Product A"} and ${second?.name || "Product B"}:`,
    `- Price: ${first?.name || "Product A"} = ${chatbotConfig.currencySymbol}${firstPrice}, ${second?.name || "Product B"} = ${chatbotConfig.currencySymbol}${secondPrice}`,
    `- Rating: ${Number(first?.rating || 0).toFixed(1)} (${Number(first?.reviews || 0)} reviews) vs ${Number(second?.rating || 0).toFixed(1)} (${Number(second?.reviews || 0)} reviews)`,
    `- Use case: ${first?.name || "Product A"} -> ${firstSentence(first?.description)} | ${second?.name || "Product B"} -> ${firstSentence(second?.description)}`,
    `Recommendation: ${recommended?.name || "Product"}`,
  ];

  if (budget !== null) {
    if (Number(recommended?.price || 0) <= budget) {
      lines.push(`Reason: It fits your budget (${chatbotConfig.currencySymbol}${budget}) and has stronger overall value from available product data.`);
    } else {
      lines.push(`Reason: None are fully within ${chatbotConfig.currencySymbol}${budget}, so this is the closest balanced option.`);
    }
  } else {
    lines.push(`Reason: It scores better on overall product signals (rating, reviews, relevance, and availability). If price is your only priority, choose ${other?.name === recommended?.name ? "the other option" : other?.name || "the other option"}.`);
  }

  return lines.join("\n");
}

function formatNoResultsMessage() {
  return chatbotConfig.noResultsMessage;
}

function firstSentence(text) {
  const value = String(text || "").trim();
  if (!value) return "No extra details available right now.";

  const chunks = value
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const best = chunks.find((item) => item.length >= 20) || chunks[0] || value;
  return String(best).trim();
}

function formatProductUseCases(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return formatNoResultsMessage();
  }

  return products
    .slice(0, 5)
    .map((product, index) => {
      const name = escapeMarkdown(product?.name || "Product");
      const description = escapeMarkdown(firstSentence(product?.description));
      const category = escapeMarkdown(String(product?.categoryName || "general"));
      const price = Number(product?.price || 0);

      return `${index + 1}. **${name}**\n- Use: ${description}\n- Best for: users looking for ${category} products\n- Price: ${chatbotConfig.currencySymbol}${price}`;
    })
    .join("\n\n");
}

function pickBestProduct(products, message) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const scored = products.map((product) => ({
    product,
    score: scoreProductGenerally(product, message),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.product || null;
}

function selectBestProduct(products, message) {
  return pickBestProduct(products, message);
}

function formatRecommendationFromProducts(products, message, baseUrl) {
  const best = pickBestProduct(products, message);
  if (!best) return formatNoResultsMessage();

  const safeName = escapeMarkdown(best.name || "Product");
  const description = escapeMarkdown(firstSentence(best.description));
  const category = escapeMarkdown(String(best.categoryName || "general"));
  const productId = String(best?._id || best?.id || "").trim();
  const productLink = productId
    ? `${baseUrl}/product/${encodeURIComponent(productId)}`
    : `${baseUrl}${chatbotConfig.searchPagePath}?q=${encodeURIComponent(best.name)}`;

  return `Recommended: **${safeName}**\nWhy: ${description}\nBest for: ${category}\nPrice: ${chatbotConfig.currencySymbol}${Number(best.price || 0)}\n[View Product](${productLink})`;
}

function formatProductResults(products, baseUrl) {
  if (!Array.isArray(products) || products.length === 0) {
    return formatNoResultsMessage();
  }

  return products.map((product) => formatProductCard(product, baseUrl)).join("\n\n");
}

module.exports = {
  buildProductCardPayload,
  buildProductCardsPayload,
  formatComparisonFromProducts,
  formatProductSearchSummary,
  formatProductCard,
  formatNoResultsMessage,
  formatProductResults,
  formatProductUseCases,
  formatRecommendationFromProducts,
  selectBestProduct,
};
