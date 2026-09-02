const COMPANY_KEYWORDS = [
  "earnings",
  "revenue",
  "profit",
  "loss",
  "contract",
  "deal",
  "partnership",
  "acquisition",
  "acquire",
  "merger",
  "order",
  "agreement",
  "launch",
  "product",
  "guidance",
  "forecast",
  "dividend",
  "buyback",
  "resigns",
  "appoints",
  "ceo",
  "cfo",
  "filing",
  "regulatory",
  "approval",
  "investment",
];

function classifyNews(newsItem, symbol, companyName = "") {
  const title = (newsItem.title || "").toLowerCase();

  const stockSymbol = symbol.toLowerCase();
  const company = companyName.toLowerCase();

  const mentionsCompany =
    title.includes(stockSymbol) ||
    (company && title.includes(company));

  const mentionsCompanyEvent = COMPANY_KEYWORDS.some(
    (keyword) => title.includes(keyword)
  );

  if (mentionsCompany && mentionsCompanyEvent) {
    return "COMPANY_SPECIFIC";
  }

  if (mentionsCompany) {
    return "COMPANY_SPECIFIC";
  }

  if (mentionsCompanyEvent) {
    return "POSSIBLY_RELEVANT";
  }

  return "MARKET_OR_OTHER";
}

function filterCompanyNews(news, symbol, companyName = "") {
  return news
    .map((item) => ({
      ...item,
      relevance: classifyNews(item, symbol, companyName),
    }))
    .filter(
      (item) =>
        item.relevance === "COMPANY_SPECIFIC" ||
        item.relevance === "POSSIBLY_RELEVANT"
    );
}

module.exports = {
  classifyNews,
  filterCompanyNews,
};