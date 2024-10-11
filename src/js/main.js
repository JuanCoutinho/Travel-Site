import { fetchFlights } from './api/amadeus.js';
import { fetchAirportImage } from './api/wikimedia.js'; // Importa a função para buscar imagens da Wikimedia
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
      const flights = await fetchFlights(origin, destination, departureDate, adults);
      // Busca imagens dos aeroportos no Wikimedia
      const departureImageUrl = await fetchAirportImage(originInput);
      const destinationImageUrl = await fetchAirportImage(destinationInput);

      displayFlights(flights.data, destinationImageUrl, originInput, destinationInput);
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
