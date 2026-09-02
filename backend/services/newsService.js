async function getCompanyNews(symbol) {
  try {
    const upperSymbol = symbol.toUpperCase();

    const url =
      `https://www.nseindia.com/api/corporate-announcements?` +
      `index=equities&symbol=${encodeURIComponent(upperSymbol)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.nseindia.com/",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `NSE announcements request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const meaningfulKeywords = [
      "contract",
      "order",
      "deal",
      "partnership",
      "acquisition",
      "merger",
      "business",
      "transformation",
      "artificial intelligence",
      "ai ",
      "launch",
      "product",
      "results",
      "financial results",
      "earnings",
      "dividend",
      "buyback",
      "bonus",
      "appointment",
      "resignation",
      "approval",
      "regulatory",
      "agreement",
      "collaboration",
      "investment",
      "expansion",
    ];

    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - 90);

    const filtered = (data || [])
      .map((item) => {
        const publishedAt = item.an_dt || "";

        return {
          symbol: item.symbol || upperSymbol,
          companyName: item.sm_name || "",
          title: item.desc || "",
          description: item.attchmntText || "",
          publishedAt,
          attachment: item.attchmntFile || "",
          isin: item.sm_isin || "",
        };
      })
      .filter((item) => {
        const announcementDate = new Date(item.publishedAt);

        if (isNaN(announcementDate.getTime())) {
          return false;
        }

        return announcementDate >= cutoffDate;
      })
      .filter((item) => {
        const text =
          `${item.title} ${item.description}`.toLowerCase();

        return meaningfulKeywords.some((keyword) =>
          text.includes(keyword)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.publishedAt) -
          new Date(a.publishedAt)
      );

    return filtered.slice(0, 30);
  } catch (error) {
    console.error(
      "Company announcements error:",
      error.message
    );

    return [];
  }
}

module.exports = {
  getCompanyNews,
};
