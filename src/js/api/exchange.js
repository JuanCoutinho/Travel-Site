const exchangeRateApiKey = "f0a82d5f3400636152941e1a";

async function fetchExchangeRate() {
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/latest/EUR`);

    if (!response.ok) {
      const errorDetails = await response.text(); // Obter detalhes do erro
      throw new Error(`Erro ao obter a cotação do euro: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();

    // Verificar se a taxa de conversão existe no objeto retornado
    if (!data || !data.conversion_rates || !data.conversion_rates.BRL) {
      throw new Error("Dados de conversão inválidos ou ausentes na resposta.");
    }

    return data.conversion_rates.BRL; // Retornar taxa de conversão para BRL
  } catch (error) {
    console.error("Erro ao obter a taxa de câmbio:", error);
    return null; // Ou trate o erro de outra forma, dependendo da sua necessidade
  }
}

export { fetchExchangeRate };
