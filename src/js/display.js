import { fetchExchangeRate } from './api/exchange.js';
import { fetchAirportImage } from './api/wikimedia.js';
import { fetchAirlineImage } from './api/unsplash.js'; 

let airlineLogos = {};

async function loadAirlineLogos() {
  const response = await fetch('./csv/companhias_aereas.csv');
  const text = await response.text();
  const rows = text.split('\n').slice(1);

  rows.forEach(row => {
    const [id, nome, sigla, logo] = row.split(',');
    if (sigla) {
      airlineLogos[sigla.trim()] = logo.trim();
    }
  });
}

loadAirlineLogos();

async function displayFlights(flights, destinationImageUrl, departureInput, arrivalInput) {
  const resultsContainer = document.getElementById("flight-results");
  resultsContainer.innerHTML = "";

  const exchangeRate = await fetchExchangeRate();
  if (!exchangeRate) {
    resultsContainer.innerHTML = '<p class="text-red-500">Erro ao obter a taxa de câmbio. Tente novamente.</p>';
    return;
  }

  const sortedFlights = flights.sort((a, b) => a.price.total - b.price.total);
  const cheapFlights = sortedFlights.slice(0, 9);
  const remainingFlights = sortedFlights.slice(9);

  async function renderFlights(flights) {
    for (const flight of flights) {
      const price = flight.price.total;
      const currency = flight.price.currency;
      const priceInBRL = currency === "EUR" ? (price * exchangeRate).toFixed(2) : price;

      const departure = flight.itineraries[0].segments[0].departure;
      const arrival = flight.itineraries[0].segments.slice(-1)[0].arrival;
      const airlineName = flight.itineraries[0].segments[0].carrierCode;

      const airlineImageUrl = airlineLogos[airlineName] || "https://cdn-icons-png.flaticon.com/512/6557/6557822.png";

      const imageUrl = destinationImageUrl || "https://cdn-icons-png.flaticon.com/512/7120/7120893.png";
      const departureAirportImageUrl = await fetchAirportImage(departureInput);
      const arrivalAirportImageUrl = await fetchAirportImage(arrivalInput);

      const finalImageUrl = arrivalAirportImageUrl || imageUrl;

      const flightCard = document.createElement("div");
      flightCard.classList.add("bg-white", "shadow-lg", "rounded-lg", "p-4", "mb-4", "flex", "items-center");

      const imageElement = `<img src="${finalImageUrl}" alt="Aeroporto" class="w-24 h-24 rounded-lg mr-4">`;
      const flightInfo = `
        <div class="flex-grow">
          <h2 class="text-xl font-bold mb-2">${arrival.iataCode} (${arrival.at.split("T")[0]})</h2>
          <p class="text-gray-500 mb-1">Partida: ${departure.iataCode} (${departure.at.split("T")[0]})</p>
          <p class="text-gray-500 mb-1">Chegada: ${arrival.iataCode} (${arrival.at.split("T")[0]})</p>
          <p class="text-gray-700 font-bold mb-1">Preço: R$ ${priceInBRL}</p>
        </div>
      `;
      const airlineInfo = `
        <div class="text-right ml-12">
          <img src="${airlineImageUrl}" alt="Companhia" class="w-14 h-auto mb-2 mx-auto">
          <p class="text-sm font-semibold">${airlineName}</p>
          <p class="text-xs text-gray-500">Econômica</p>
        </div>
      `;

      flightCard.innerHTML = `<div class="flex">${imageElement}${flightInfo}${airlineInfo}</div>`;
      resultsContainer.appendChild(flightCard);
    }
  }

  await renderFlights(cheapFlights);

  if (remainingFlights.length > 0) {
    const moreFlightsMessage = document.createElement("div");
    moreFlightsMessage.classList.add("text-center", "mt-4");
    moreFlightsMessage.innerHTML = `
      <p>🤔 Deseja mostrar mais? As próximas ofertas são um pouco mais caras que o normal...</p>
      <button id="show-more" class="bg-blue-500 text-white p-2 rounded mt-2">Mostrar mais</button>
    `;
    resultsContainer.appendChild(moreFlightsMessage);

    document.getElementById("show-more").addEventListener("click", async () => {
      moreFlightsMessage.remove(); 
      await renderFlights(remainingFlights);
    });
  }

  if (resultsContainer.innerHTML === "") {
    resultsContainer.innerHTML = '<p class="text-gray-500">Nenhum voo encontrado.</p>';
  }
}

export { displayFlights };
