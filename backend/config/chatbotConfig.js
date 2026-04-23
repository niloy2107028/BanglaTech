const defaults = {
  botName: "BanglaMart Bot",
  noResultsMessage: "Sorry, we do not have this item right now.",
  searchPagePath: "/search",
  currencySymbol: "৳",
};

const chatbotConfig = {
  botName: process.env.CHATBOT_NAME || defaults.botName,
  noResultsMessage: process.env.CHATBOT_NO_RESULTS_MESSAGE || defaults.noResultsMessage,
  searchPagePath: process.env.CHATBOT_SEARCH_PAGE_PATH || defaults.searchPagePath,
  currencySymbol: process.env.CHATBOT_CURRENCY_SYMBOL || defaults.currencySymbol,
};

module.exports = {
  chatbotConfig,
};
