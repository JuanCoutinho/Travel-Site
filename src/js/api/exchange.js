const exchangeRateApiKey = "f0a82d5f3400636152941e1a";

async function fetchExchangeRate() {
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/latest/EUR`);

    if (!response.ok) {
      throw new Error("Erro ao obter a cotação do euro");
    }

    const data = await response.json();
    return data.conversion_rates.BRL; 
  } catch (error) {
    return null;
  }
}

export { fetchExchangeRate };
