import { fetchFlights } from './api/amadeus.js';
import { fetchDestinationImage } from './api/unsplash.js';
import { displayFlights } from './display.js';

$(document).ready(function () {
  $("#flight-search-form").on("submit", async function (event) {
    event.preventDefault();

    // Extrai os códigos IATA dos inputs, considerando que o valor pode ser "Nome do aeroporto (IATA)"
    const originInput = $("#search1").val();
    const destinationInput = $("#search2").val();

    const origin = extractIATA(originInput);
    const destination = extractIATA(destinationInput);
    const departureDate = $("#departure-date").val();
    const adults = $("#adults").val();

    if (!origin || !destination || origin.length !== 3 || destination.length !== 3) {
      alert('Por favor, selecione aeroportos válidos com códigos IATA.');
      return;
    }

    try {
      const flights = await fetchFlights(origin, destination, departureDate, adults);
      const destinationImageUrl = await fetchDestinationImage(destination);
      displayFlights(flights.data, destinationImageUrl);
    } catch (error) {
      console.error("Erro:", error);
      document.getElementById("flight-results").innerHTML = '<p class="text-red-500">Erro ao buscar os voos. Tente novamente.</p>';
    }
  });

  // Função para extrair o código IATA do input no formato "Nome (IATA)"
  function extractIATA(inputValue) {
    const match = inputValue.match(/\((\w{3})\)$/);
    return match ? match[1] : '';
  }
});
