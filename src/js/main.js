import { fetchFlights } from './api/amadeus.js';
import { fetchAirportImage } from './api/wikimedia.js';
import { displayFlights } from './display.js';

$(document).ready(function () {
  $("#flight-search-form").on("submit", async function (event) {
    event.preventDefault();

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

    const loadingDiv = document.getElementById("loading");
    loadingDiv.classList.remove('hidden');
    document.getElementById("flight-results").innerHTML = '';

    try {
      const allFlights = [];
      const departureImageUrl = await fetchAirportImage(originInput);
      const destinationImageUrl = await fetchAirportImage(destinationInput);

      // Função para adicionar dias à data original
      function addDaysToDate(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }

      // Loop para buscar voos na data selecionada e nos próximos 7 dias
      for (let i = 0; i <= 7; i++) {
        const currentDepartureDate = addDaysToDate(departureDate, i);
        const flights = await fetchFlights(origin, destination, currentDepartureDate, adults);
        
        // Combinar os resultados de cada dia
        if (flights && flights.data && flights.data.length > 0) {
          allFlights.push(...flights.data);
        }
      }

      if (allFlights.length > 0) {
        displayFlights(allFlights, destinationImageUrl, originInput, destinationInput);
      } else {
        document.getElementById("flight-results").innerHTML = '<p class="text-red-500">Nenhum voo encontrado nos próximos 7 dias.</p>';
      }

    } catch (error) {
      console.error("Erro:", error);
      document.getElementById("flight-results").innerHTML = '<p class="text-red-500">Erro ao buscar os voos. Tente novamente.</p>';
    } finally {
      loadingDiv.classList.add('hidden');
    }
  });

  function extractIATA(inputValue) {
    const match = inputValue.match(/\((\w{3})\)$/);
    return match ? match[1] : '';
  }
});
