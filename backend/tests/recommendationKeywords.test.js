const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeKeyword,
  splitSearchTerms,
  extractProductKeywords,
  mergeKeywords,
  scoreProductAgainstKeywords,
} = require("../utils/recommendationKeywords");

test("normalizeKeyword removes noise and lowercases", () => {
  assert.equal(normalizeKeyword("  Gaming@@ Laptop!! "), "gaming laptop");
});

test("splitSearchTerms returns phrase plus unique tokens", () => {
  const terms = splitSearchTerms("Gaming Laptop Pro");
  assert.deepEqual(terms, ["gaming laptop pro", "gaming", "laptop", "pro"]);
});

test("extractProductKeywords includes name, category, and brand", () => {
  const keywords = extractProductKeywords({
    name: "Wireless Mouse",
    categoryName: "Mobile & Accessories",
    brand: "Logitech",
  });

  assert.deepEqual(keywords, [
    "wireless mouse",
    "mobile & accessories",
    "logitech",
  ]);
});

test("mergeKeywords increases score for existing keyword", () => {
  const merged = mergeKeywords(
    [
      {
        value: "gaming laptop",
        source: "search",
        score: 2,
        lastUsedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    ["gaming laptop", "wireless mouse"],
    "view",
    3
  );

  const laptop = merged.find((item) => item.value === "gaming laptop");
  const mouse = merged.find((item) => item.value === "wireless mouse");

  assert.equal(laptop.score, 5);
  assert.equal(laptop.source, "view");
  assert.equal(Boolean(mouse), true);
});

test("scoreProductAgainstKeywords ranks exact name match higher", () => {
  const now = new Date();
  const keywords = [{ value: "gaming laptop", source: "view", score: 1, lastUsedAt: now }];

  const matchingScore = scoreProductAgainstKeywords(
    {
      name: "Gaming Laptop",
      brand: "BrandX",
      categoryName: "Electronics",
      description: "Portable performance machine",
      specifications: {},
      rating: 0,
      reviews: 0,
      featured: false,
      stock: 0,
    },
    keywords
  );

  const nonMatchingScore = scoreProductAgainstKeywords(
    {
      name: "Office Chair",
      brand: "BrandX",
      categoryName: "Furniture",
      description: "Comfortable seating",
      specifications: {},
      rating: 0,
      reviews: 0,
      featured: false,
      stock: 0,
    },
    keywords
  );

  assert.equal(matchingScore > nonMatchingScore, true);
});
