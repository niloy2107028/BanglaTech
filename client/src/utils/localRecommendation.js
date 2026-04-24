const LOCAL_REC_KEYWORDS_KEY = 'banglamart_local_rec_keywords_v1';
const LOCAL_REC_CONSENT_KEY = 'banglamart_local_rec_consent_v1';
const MAX_LOCAL_KEYWORDS = 50;

function normalizeKeyword(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s&+-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readJsonStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore localStorage write failures.
  }
}

function readKeywordStore() {
  const items = readJsonStorage(LOCAL_REC_KEYWORDS_KEY, []);
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      value: normalizeKeyword(item?.value || ''),
      score: Number(item?.score || 0),
      lastUsedAt: Number(item?.lastUsedAt || 0),
      source: String(item?.source || 'unknown'),
    }))
    .filter((item) => item.value && item.score > 0);
}

function writeKeywordStore(items) {
  writeJsonStorage(LOCAL_REC_KEYWORDS_KEY, items.slice(0, MAX_LOCAL_KEYWORDS));
}

function mergeKeywordSignals(existing, incoming, source, weight) {
  const now = Date.now();
  const table = new Map();

  for (const item of existing) {
    if (!item?.value) continue;
    table.set(item.value, {
      value: item.value,
      score: Number(item.score || 0),
      lastUsedAt: Number(item.lastUsedAt || 0),
      source: item.source || source,
    });
  }

  for (const raw of incoming) {
    const key = normalizeKeyword(raw);
    if (!key || key.length < 3) continue;

    const current = table.get(key);
    if (current) {
      current.score += weight;
      current.lastUsedAt = now;
      current.source = source;
    } else {
      table.set(key, {
        value: key,
        score: weight,
        lastUsedAt: now,
        source,
      });
    }
  }

  return [...table.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.lastUsedAt - a.lastUsedAt;
    })
    .slice(0, MAX_LOCAL_KEYWORDS);
}

function splitSearchTerms(text) {
  const normalized = normalizeKeyword(text);
  if (!normalized) return [];

  const words = normalized
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

  return Array.from(new Set([normalized, ...words]));
}

export function getLocalRecommendationConsent() {
  if (typeof window === 'undefined') return 'unknown';
  const value = window.localStorage.getItem(LOCAL_REC_CONSENT_KEY);
  if (value === 'granted' || value === 'denied') return value;
  return 'unknown';
}

export function setLocalRecommendationConsent(value) {
  if (typeof window === 'undefined') return;
  if (value !== 'granted' && value !== 'denied') return;
  window.localStorage.setItem(LOCAL_REC_CONSENT_KEY, value);
}

export function trackLocalSearchSignal(searchText) {
  const terms = splitSearchTerms(searchText);
  if (terms.length === 0) return;
  const merged = mergeKeywordSignals(readKeywordStore(), terms, 'search', 2);
  writeKeywordStore(merged);
}

export function trackLocalProductSignal(product) {
  const terms = Array.from(
    new Set(
      [product?.name, product?.brand, product?.categoryName]
        .map((value) => normalizeKeyword(value))
        .filter(Boolean),
    ),
  );
  if (terms.length === 0) return;
  const merged = mergeKeywordSignals(readKeywordStore(), terms, 'view', 1);
  writeKeywordStore(merged);
}

export function getLocalRecommendationKeywords(limit = 8) {
  return readKeywordStore().slice(0, Math.max(Number(limit) || 0, 0));
}
