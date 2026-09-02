async function getCompanyInfo(symbol) {
  try {
    const yahooSymbol = `${symbol.toUpperCase()}.NS`;

    const url =
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
        yahooSymbol
      )}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Yahoo company lookup failed: ${response.status}`
      );
    }

    const data = await response.json();

    const quote = data.quoteResponse?.result?.[0];

    if (!quote) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      name: quote.longName || quote.shortName || null,
      exchange: quote.fullExchangeName || quote.exchange || null,
      currency: quote.currency || null,
      sector: quote.sector || null,
      industry: quote.industry || null,
    };
  } catch (error) {
    console.error(
      "Company information error:",
      error.message
    );

    return null;
  }
}

module.exports = {
  getCompanyInfo,
};