const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tokenizeText(value = '') {
  return normalizeText(value).match(TOKEN_PATTERN) || [];
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchQuery(search = '') {
  const words = tokenizeText(search);

  if (words.length === 0) {
    return {};
  }

  return {
    $and: words.map((word) => ({
      $or: [
        { name: { $regex: escapeRegex(word), $options: 'i' } },
        { brand: { $regex: escapeRegex(word), $options: 'i' } },
        { categoryName: { $regex: escapeRegex(word), $options: 'i' } },
        { description: { $regex: escapeRegex(word), $options: 'i' } },
      ],
    })),
  };
}

function levenshteinDistance(a = '', b = '') {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function buildSearchVocabulary(products = []) {
  const vocabulary = new Set();

  products.forEach((product) => {
    [product.name, product.brand, product.categoryName, product.description].forEach((field) => {
      tokenizeText(field).forEach((token) => {
        if (token.length >= 3) {
          vocabulary.add(token);
        }
      });
    });
  });

  return Array.from(vocabulary);
}

function getBestCorrection(token, vocabulary = []) {
  if (token.length < 3) return token;
  if (vocabulary.includes(token)) return token;

  const firstLetterMatches = vocabulary.filter((candidate) => candidate[0] === token[0]);
  const pool = firstLetterMatches.length > 0 ? firstLetterMatches : vocabulary;

  let bestCandidate = token;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of pool) {
    const lengthGap = Math.abs(candidate.length - token.length);
    if (lengthGap > 3) continue;

    const distance = levenshteinDistance(token, candidate);
    const threshold = Math.max(1, Math.floor(Math.max(token.length, candidate.length) / 3));

    if (distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function suggestSearchCorrection(search = '', vocabulary = []) {
  const tokens = tokenizeText(search);
  if (tokens.length === 0) {
    return {
      originalQuery: search,
      correctedQuery: search,
      changed: false,
      correctedTokens: [],
    };
  }

  const correctedTokens = tokens.map((token) => getBestCorrection(token, vocabulary));
  const correctedQuery = correctedTokens.join(' ').trim();

  return {
    originalQuery: search,
    correctedQuery,
    changed: normalizeText(search) !== correctedQuery,
    correctedTokens,
  };
}

module.exports = {
  buildSearchVocabulary,
  buildSearchQuery,
  suggestSearchCorrection,
  tokenizeText,
  normalizeText,
};
