const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSearchVocabulary,
  buildSearchQuery,
  suggestSearchCorrection,
  tokenizeText,
} = require("../utils/searchCorrection");

test("tokenizeText normalizes accents and punctuation", () => {
  const tokens = tokenizeText("Caf\u00E9, Samsung!! 43\"");
  assert.deepEqual(tokens, ["cafe", "samsung", "43"]);
});

test("buildSearchQuery returns empty object for blank input", () => {
  assert.deepEqual(buildSearchQuery("   "), {});
});

test("buildSearchVocabulary collects searchable tokens", () => {
  const vocabulary = buildSearchVocabulary([
    {
      name: "Samsung Galaxy Phone",
      brand: "Samsung",
      categoryName: "Mobile & Accessories",
      description: "Wireless fast charging",
    },
  ]);

  assert.equal(vocabulary.includes("samsung"), true);
  assert.equal(vocabulary.includes("galaxy"), true);
  assert.equal(vocabulary.includes("wireless"), true);
});

test("suggestSearchCorrection fixes close misspellings", () => {
  const result = suggestSearchCorrection("Samsng hedfone", [
    "samsung",
    "headphone",
    "wireless",
  ]);

  assert.equal(result.correctedQuery, "samsung headphone");
  assert.equal(result.changed, true);
});
