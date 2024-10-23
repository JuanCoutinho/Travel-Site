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
async function renderFlights(flights, exchangeRate, destinationImageUrl, departureInput, arrivalInput) {
  const resultsContainer = document.getElementById("flight-results");
  const googleFlightsUrlBase = "https://www.google.com/flights?hl=pt#flt=";

  for (const flight of flights) {
    const price = flight.price.total;
    const currency = flight.price.currency;

    const priceInBRL = currency !== "BRL" ? (price * exchangeRate).toFixed(2) : price;

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
        <a href="${googleFlightsUrlBase}${departure.iataCode}.${arrival.iataCode}.${departure.at.split("T")[0]}/;f=${departure.iataCode};t=${arrival.iataCode};d=${departure.at.split("T")[0]}" target="_blank" class="text-blue-500 underline">Ver no Google Flights</a>
      </div>`;
    const airlineInfo = `
      <div class="text-right ml-12">
        <img src="${airlineImageUrl}" alt="Companhia" class="w-14 h-auto mb-2 mx-auto">
        <p class="text-sm font-semibold">${airlineName}</p>
        <p class="text-xs text-gray-500">Econômica</p>
      </div>`;

    flightCard.innerHTML = `<div class="flex">${imageElement}${flightInfo}${airlineInfo}</div>`;
    resultsContainer.appendChild(flightCard);
  }
}

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

  // Dicionário para armazenar os preços por data
  const dailyPrices = {};

  sortedFlights.forEach(flight => {
    const departureDate = flight.itineraries[0].segments[0].departure.at.split('T')[0]; // Pegando a data
    const price = flight.price.total;
    const currency = flight.price.currency;

    const priceInBRL = currency !== "BRL" ? (price * exchangeRate).toFixed(2) : price;

    // Se já existe a data, adicionar o preço à lista de preços
    if (dailyPrices[departureDate]) {
      dailyPrices[departureDate].push(parseFloat(priceInBRL));
    } else {
      dailyPrices[departureDate] = [parseFloat(priceInBRL)];
    }
  });

  // Calculando a média de preços por dia
  const averagePricesByDay = Object.keys(dailyPrices).map(date => {
    const prices = dailyPrices[date];
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return { date, averagePrice: averagePrice.toFixed(2) };
  });

  // Ordenar os dados por data
  averagePricesByDay.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Filtrar para apenas 7 dias
  const top7Days = averagePricesByDay.slice(0, 7);

  // Chamar a função para desenhar o gráfico
  drawChart(top7Days);

  // Renderizando os voos
  await renderFlights(cheapFlights, exchangeRate, destinationImageUrl, departureInput, arrivalInput);

  // Mostrar mais voos, se houver
  if (remainingFlights.length > 0) {
    const moreFlightsMessage = document.createElement("div");
    moreFlightsMessage.classList.add("text-center", "mt-4");
    moreFlightsMessage.innerHTML = `
      <p>🤔 Deseja mostrar mais? As próximas ofertas são um pouco mais caras que o normal...</p>
      <button id="show-more" class="bg-blue-500 text-white p-2 rounded mt-2">Mostrar mais</button>`;
    resultsContainer.appendChild(moreFlightsMessage);

    document.getElementById("show-more").addEventListener("click", async () => {
      moreFlightsMessage.remove();
      await renderFlights(remainingFlights, exchangeRate, destinationImageUrl, departureInput, arrivalInput);
    });
  }

  if (resultsContainer.innerHTML === "") {
    resultsContainer.innerHTML = '<p class="text-gray-500">Nenhum voo encontrado.</p>';
  }
}

// Função para desenhar o gráfico usando Chart.js
function drawChart(data) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  const labels = data.map(d => d.date);
  const prices = data.map(d => d.averagePrice);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Média de Preço (R$)',
        data: prices,
        borderColor: 'rgba(255, 221, 51, 1)', // Amarelo sólido
        backgroundColor: 'rgba(255, 221, 51, 0.2)', // Amarelo claro para preenchimento
        borderWidth: 2,
        fill: true, // Preencher a área sob a linha
        pointBackgroundColor: 'rgba(255, 221, 51, 1)', // Cor dos pontos
        pointBorderColor: '#fff', // Borda dos pontos
        pointHoverBackgroundColor: '#fff', // Cor ao passar o mouse
        pointHoverBorderColor: 'rgba(255, 221, 51, 1)', // Borda ao passar o mouse
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 221, 51, 0.3)' // Cor da grade do eixo X
          },
          ticks: {
            color: '#000' // Cor dos rótulos do eixo X
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 221, 51, 0.3)' // Cor da grade do eixo Y
          },
          ticks: {
            color: '#000' // Cor dos rótulos do eixo Y
          },
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#000' // Cor do texto da legenda
          },
        },
      },
    }
  });
}

// Estrutura para armazenar os nomes das cidades
const airportCities = {};

// Função para carregar os dados de aeroportos e preencher o mapeamento
async function loadAirportCities() {
  const response = await fetch('./csv/airports.csv');
  const text = await response.text();
  const rows = text.split('\n').slice(1);

  rows.forEach(row => {
    const [id, ident, type, name, latitude_deg, longitude_deg, elevation_ft, continent, iso_country, iso_region, municipality, scheduled_service, gps_code, iata_code] = row.split(',');
    if (iata_code && municipality) {
      airportCities[iata_code.trim()] = municipality.trim();
    }
  });
}

// Chame a função ao iniciar
await loadAirportCities();

export { displayFlights };
