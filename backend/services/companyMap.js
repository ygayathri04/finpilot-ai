const companies = {
  TCS: {
    name: "Tata Consultancy Services",
    sector: "Information Technology",
  },

  INFY: {
    name: "Infosys",
    sector: "Information Technology",
  },

  RELIANCE: {
    name: "Reliance Industries",
    sector: "Oil, Gas & Conglomerate",
  },

  HDFCBANK: {
    name: "HDFC Bank",
    sector: "Banking",
  },

  ICICIBANK: {
    name: "ICICI Bank",
    sector: "Banking",
  },

  SBIN: {
    name: "State Bank of India",
    sector: "Banking",
  },

  WIPRO: {
    name: "Wipro",
    sector: "Information Technology",
  },

  ITC: {
    name: "ITC",
    sector: "Consumer Goods",
  },

  LT: {
    name: "Larsen & Toubro",
    sector: "Engineering & Construction",
  },

  BHARTIARTL: {
    name: "Bharti Airtel",
    sector: "Telecommunications",
  },
};

function getCompany(symbol) {
  return companies[symbol.toUpperCase()] || null;
}

module.exports = {
  companies,
  getCompany,
};