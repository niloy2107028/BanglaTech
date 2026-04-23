const { TTLCache } = require("../../utils/cache");

const chatCache = new TTLCache(120000, 500);
const searchCache = new TTLCache(180000, 500);

function invalidateChatbotCaches() {
  chatCache.clear();
  searchCache.clear();
}

module.exports = {
  chatCache,
  searchCache,
  invalidateChatbotCaches,
};
