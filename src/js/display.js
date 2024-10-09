import { fetchExchangeRate } from './api/exchange.js';
import { fetchAirlineImage, fetchDestinationImage } from './api/unsplash.js';

async function displayFlights(flights, destinationImageUrl) {
  const resultsContainer = document.getElementById("flight-results");
  resultsContainer.innerHTML = "";

  const exchangeRate = await fetchExchangeRate();
  if (!exchangeRate) {
    resultsContainer.innerHTML = '<p class="text-red-500">Erro ao obter a taxa de câmbio. Tente novamente.</p>';
    return;
  }

  for (const flight of flights) {
    const price = flight.price.total;
    const currency = flight.price.currency;
    const priceInBRL = currency === "EUR" ? (price * exchangeRate).toFixed(2) : price;

    const departure = flight.itineraries[0].segments[0].departure;
    const arrival = flight.itineraries[0].segments.slice(-1)[0].arrival;
    const airlineName = flight.itineraries[0].segments[0].carrierCode;

    const airlineImageUrl = await fetchAirlineImage(airlineName);
    const imageUrl = destinationImageUrl || "URL_FALLBACK_DA_IMAGEM";

    const flightCard = document.createElement("div");
    flightCard.classList.add("bg-white", "shadow-lg", "rounded-lg", "p-4", "mb-4", "flex", "items-center");

    const imageElement = `<img src="${imageUrl}" alt="Destino" class="w-24 h-24 rounded-lg mr-4">`;
    const flightInfo = `
      <div class="flex-grow">
        <h2 class="text-xl font-bold mb-2">${arrival.iataCode} (${arrival.at.split("T")[0]})</h2>
        <p class="text-gray-500 mb-1">Partida: ${departure.iataCode} (${departure.at.split("T")[0]})</p>
        <p class="text-gray-500 mb-1">Chegada: ${arrival.iataCode} (${arrival.at.split("T")[0]})</p>
        <p class="text-gray-700 font-bold mb-1">Preço: R$ ${priceInBRL}</p>
      </div>
    `;
    const airlineInfo = `
      <div class="text-right">
        <img src="${airlineImageUrl || "URL_DO_LOGO_DA_COMPANHIA"}" alt="Companhia" class="w-12 h-12 mb-2 mx-auto">
        <p class="text-sm font-semibold">${airlineName}</p>
        <p class="text-xs text-gray-500">Econômica</p>
      </div>
    `;

    flightCard.innerHTML = `<div class="flex">${imageElement}${flightInfo}${airlineInfo}</div>`;
    resultsContainer.appendChild(flightCard);
  }

  if (resultsContainer.innerHTML === "") {
    resultsContainer.innerHTML = '<p class="text-gray-500">Nenhum voo encontrado.</p>';
  }
}

export { displayFlights };
