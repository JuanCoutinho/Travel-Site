const clientId = "YAlaZGKGvim8YUHyFB8rVVhHyn6ATcs5";
const clientSecret = "1uYeaSO2zAfveFRM";
const exchangeRateApiKey = "f0a82d5f3400636152941e1a";

let regionToNameMap = {};
let airlineLogos = {};
const airports = [];
const iataToStateMap = {};

async function loadAirlineLogos() {
  const response = await fetch("../src/csv/companhias_aereas.csv");
  const text = await response.text();
  const rows = text.split("\n").slice(1);

  rows.forEach((row) => {
    const [id, nome, sigla, logo] = row.split(",");
    if (sigla) {
      airlineLogos[sigla.trim()] = logo.trim();
    }
  });
}

async function getAuthToken() {
  try {
    const response = await fetch(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Erro ao obter token: ${response.status} - ${errorDetails}`
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erro na função getAuthToken:", error);
    throw error;
  }
}

async function fetchExchangeRate() {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/latest/EUR`
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Erro ao obter a cotação do euro: ${response.status} - ${errorDetails}`
      );
    }

    const data = await response.json();
    return data.conversion_rates.BRL;
  } catch (error) {
    console.error("Erro na função fetchExchangeRate:", error);
    return null;
  }
}

async function loadAirports() {
  return new Promise((resolve, reject) => {
    Papa.parse("../src/csv/airports.csv", {
      header: true,
      download: true,
      complete: (results) => {
        results.data.forEach((airport) => {
          if (airport.type === "large_airport" && airport.iata_code) {
            airports.push({
              name: airport.name,
              iata: airport.iata_code,
              state: airport.iso_region,
              municipality: airport.municipality,  
              latitude: parseFloat(airport.latitude_deg),
              longitude: parseFloat(airport.longitude_deg),
            });
            iataToStateMap[airport.iata_code] = {
              state: airport.iso_region,
              municipality: airport.municipality,  
            };
          }
        });
        resolve();
      },
      error: (error) => {
        reject(`Erro ao carregar CSV: ${error.message}`);
      },
    });
  });
}


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function findNearestAirport(latitude, longitude) {
  let nearest = null;
  let minDistance = Infinity;

  airports.forEach((airport) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      airport.latitude,
      airport.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = airport;
    }
  });

  return nearest;
}

async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(`Erro ao obter localização: ${error.message}`);
        }
      );
    } else {
      reject("Geolocalização não é suportada pelo navegador.");
    }
  });
}

function formatDateToBrazilian(date) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Intl.DateTimeFormat("pt-BR", options).format(date);
}

async function loadRegionData() {
  return new Promise((resolve, reject) => {
    Papa.parse("../src/csv/airport_code.csv", {
      header: true,
      download: true,
      complete: (results) => {
        results.data.forEach((row) => {
          const { iso_region } = row;
          if (iso_region) {
            regionToNameMap[iso_region.trim()] = iso_region.trim();
          }
        });
        resolve();
      },
      error: (error) => {
        reject(`Erro ao carregar CSV: ${error.message}`);
      },
    });
  });
}

async function fetchFlights(origin, destination, departureDate, adults) {
  try {
    const token = await getAuthToken();
    const formattedDepartureDate = new Date(departureDate)
      .toISOString()
      .split("T")[0];

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${formattedDepartureDate}&adults=${adults}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Erro ao buscar voos: ${response.status} - ${errorDetails}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na função fetchFlights:", error);
    throw error;
  }
}

document.getElementById("searchSubmit").addEventListener("click", async () => {
  const searchQuery = document.getElementById("searchInput").value.trim().toLowerCase();
  
  const flightList = document.querySelector(".card-section");
  flightList.innerHTML = "";

  // Recarrega os dados de voos para garantir que tenhamos acesso a todos eles
  try {
    const exchangeRate = await fetchExchangeRate();
    const userLocation = await getUserLocation();
    const nearestAirport = findNearestAirport(userLocation.latitude, userLocation.longitude);
    const origin = nearestAirport.iata;

    const destinations = [
      "JFK", "LAX", "LHR", "CDG", "NRT", "DXB", "SIN", "HKG", "SYD", "YYZ",
      "FRA", "AMS", "PEK", "MIA", "GRU", "MEX", "ICN", "BKK", "IST", "SVO"
    ];

    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() + 14);

    const dates = [];
    for (let i = 0; i < 20; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i); 
      dates.push(date);
    }

    let totalFlightsDisplayed = 0;

    for (const destination of destinations) {
      for (const date of dates) {
        if (totalFlightsDisplayed >= 100) {
          console.log("Limite de 100 voos atingido.");
          return;
        }

        const formattedDateForApi = date.toISOString().split("T")[0];
        const flightsData = await fetchFlights(origin, destination, formattedDateForApi, 1);
        const flights = flightsData.data.slice(0, 60);

        flights.forEach((flight) => {
          const arrivalIata = flight.itineraries[0].segments[0].arrival.iataCode;
          const arrivalRegion = iataToStateMap[arrivalIata];
          const arrivalMunicipality = arrivalRegion.municipality || "Município desconhecido";

          // Verificar se o arrivalMunicipality corresponde à pesquisa do usuário
          if (arrivalMunicipality.toLowerCase().includes(searchQuery)) {
            if (totalFlightsDisplayed >= 100) return;

            const priceInEur = flight.price.total;
            const priceInBrl = (priceInEur * exchangeRate).toFixed(2);
            const airlineCode = flight.itineraries[0].segments[0].carrierCode;
            const airlineImageUrl = airlineLogos[airlineCode] || "https://cdn-icons-png.flaticon.com/512/6557/6557822.png";

            const departureIata = flight.itineraries[0].segments[0].departure.iataCode;
            const departureRegion = iataToStateMap[departureIata];
            const departureMunicipality = departureRegion.municipality || "Município desconhecido";

            const formattedDateForDisplay = formatDateToBrazilian(date);

            const card = document.createElement("div");
            card.classList.add("card");

            const searchQueryUrl = encodeURIComponent(`${departureMunicipality} para ${arrivalMunicipality} ${formattedDateForDisplay}`);
            const googleSearchUrl = `https://www.google.com/search?q=${searchQueryUrl}`;
            card.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-4 max-w-sm mx-auto">
           <img src="./img/logotipo star2.png.png" alt="Starsearch" style="max-width: 28px; height: auto; display: block; margin: 0 auto 16px;">
            <div class="flex flex-col items-center">
                <div class="card-header mb-4">
                  <img src="${airlineImageUrl}" alt="Companhia" class="airline-logo w-12 h-12 object-contain">
                </div>
                <div class="card-content text-center">
                  <h3 class="text-lg font-semibold mb-2">${departureMunicipality} - ${arrivalMunicipality}</h3>
                  <p class="text-gray-700">Preço: €${priceInEur} / R$${priceInBrl}</p>
                  <p class="text-gray-600">Embarque: ${departureMunicipality}</p>
                  <p class="text-gray-600">Destino: ${arrivalMunicipality}</p>
                  <p class="text-gray-600 mb-4">Data da viagem: ${formattedDateForDisplay}</p>
                  <a href="${googleSearchUrl}" target="_blank" class="flight-link text-blue-500 hover:underline">Ver opções de voo</a>
                </div>
              </div>
            </div>
          `;          

            flightList.appendChild(card);
            totalFlightsDisplayed++;
          }
        });

        if (totalFlightsDisplayed >= 100) {
          console.log("Limite de 100 voos atingido.");
          return;
        }
      }
    }
  } catch (error) {
    console.error("Erro ao buscar voos:", error);
  }
});

const searchedDestinations = [];

async function displayFlights() {
  try {
    await loadAirlineLogos();
    await loadRegionData();
    await loadAirports();

    const exchangeRate = await fetchExchangeRate();
    if (!exchangeRate) {
      console.error("Não foi possível obter a cotação do euro");
      return;
    }

    const userLocation = await getUserLocation();
    const nearestAirport = findNearestAirport(userLocation.latitude, userLocation.longitude);

    if (!nearestAirport) {
      console.error("Nenhum aeroporto encontrado nas proximidades.");
      return;
    }

    const origin = nearestAirport.iata;

    const destinations = [
      "JFK", "LAX", "LHR", "CDG", "NRT", "DXB", "SIN", "HKG", "SYD", "YYZ",
      "FRA", "AMS", "PEK", "MIA", "GRU", "MEX", "ICN", "BKK", "IST", "SVO"
    ];

    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() + 14);

    const dates = [];
    for (let i = 0; i < 20; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i); 
      dates.push(date);
    }

    const flightList = document.querySelector(".card-section");
    flightList.innerHTML = "";

    let totalFlightsDisplayed = 0;

    for (const destination of destinations) {
      for (const date of dates) {
        if (totalFlightsDisplayed >= 100) {
          console.log("Limite de 100 voos atingido.");
          return; 
        }

        const formattedDateForApi = date.toISOString().split("T")[0];
        const formattedDateForDisplay = formatDateToBrazilian(date);

        const flightsData = await fetchFlights(origin, destination, formattedDateForApi, 1);

        const flights = flightsData.data.slice(0, 60); 
        flights.forEach((flight) => {
          if (totalFlightsDisplayed >= 100) return; 

          const priceInEur = flight.price.total;
          const priceInBrl = (priceInEur * exchangeRate).toFixed(2);
          const airlineCode = flight.itineraries[0].segments[0].carrierCode;
          const airlineImageUrl = airlineLogos[airlineCode] || "https://cdn-icons-png.flaticon.com/512/6557/6557822.png";

          const departureIata = flight.itineraries[0].segments[0].departure.iataCode;
          const arrivalIata = flight.itineraries[0].segments[0].arrival.iataCode;
          const departureRegion = iataToStateMap[departureIata];
          const arrivalRegion = iataToStateMap[arrivalIata];

          const departureMunicipality = departureRegion.municipality || "Município desconhecido";
          const arrivalMunicipality = arrivalRegion.municipality || "Município desconhecido";

          // Armazenar arrivalMunicipality no array searchedDestinations
          if (!searchedDestinations.includes(arrivalMunicipality)) {
            searchedDestinations.push(arrivalMunicipality);
          }
          console.log("Adicionando destino ao array:", arrivalMunicipality);
          console.log("Destinos pesquisados até agora:", searchedDestinations);

          const card = document.createElement("div");
          card.classList.add("card");

          const searchQuery = encodeURIComponent(`${departureMunicipality} para ${arrivalMunicipality} ${formattedDateForDisplay}`);
          const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;

          card.innerHTML = `
            <img src="./img/logotipo star2.png.png" alt="Starsearch" class="starsearch-logo">
            <div class="flex flex-col">
              <div class="card-header">
                <img src="${airlineImageUrl}" alt="Companhia" class="airline-logo">
              </div>
              <div class="card-content">
                <h3>${departureMunicipality} - ${arrivalMunicipality}</h3>
                <p>Preço: €${priceInEur} / R$${priceInBrl}</p>
                <p>Embarque: ${departureMunicipality}</p>
                <p>Destino: ${arrivalMunicipality}</p>
                <p>Data da viagem: ${formattedDateForDisplay}</p>
                <a href="${googleSearchUrl}" target="_blank" class="flight-link">Ver opções de voo</a>
              </div>
            </div>
          `;

          flightList.appendChild(card);
          totalFlightsDisplayed++;
        });

        if (totalFlightsDisplayed >= 100) {
          console.log("Limite de 100 voos atingido.");
          return;
        }
      }
    }
  } catch (error) {
    console.error("Erro ao buscar voos:", error);
  }
}

displayFlights();
