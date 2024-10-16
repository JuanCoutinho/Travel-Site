const clientId = "k2wiffvdlH3Uhb05j7NGyw2GrO6rzY4E";
const clientSecret = "4UtBaRC3A15aODsi";
const exchangeRateApiKey = "f0a82d5f3400636152941e1a";

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
      throw new Error(`Erro ao obter token: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erro na função getAuthToken:", error);
    throw error;
  }
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
      throw new Error(`Erro ao buscar voos: ${response.status} - ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na função fetchFlights:", error);
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
      throw new Error(`Erro ao obter a cotação do euro: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    return data.conversion_rates.BRL;
  } catch (error) {
    console.error("Erro na função fetchExchangeRate:", error);
    return null; 
  }
}

const airports = [];

async function loadAirports() {
  return new Promise((resolve, reject) => {
    Papa.parse("../src/csv/airports.csv", {
      header: true,
      download: true,
      complete: (results) => {
        results.data.forEach(airport => {

          if (airport.type === "large_airport") {
            airports.push({
              name: airport.name,
              iata: airport.iata_code,
              latitude: parseFloat(airport.latitude_deg),
              longitude: parseFloat(airport.longitude_deg)
            });
          }
        });
        resolve();
      },
      error: (error) => {
        reject(`Erro ao carregar CSV: ${error.message}`);
      }
    });
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function findNearestAirport(latitude, longitude) {
  let nearest = null;
  let minDistance = Infinity;

  airports.forEach(airport => {
    const distance = calculateDistance(latitude, longitude, airport.latitude, airport.longitude);
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

const pexelsApiKey = "NVCNRdfNDW2JweFpgTy3kF6gEiLwabmaBhgFIgqMUJZMyQIeVFxWwP83"; 

async function fetchPexelsImage(query) {
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
      method: "GET",
      headers: {
        Authorization: pexelsApiKey,
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Erro ao buscar imagem: ${response.status} - ${errorDetails}`);
    }

    const data = await response.json();
    return data.photos.length > 0 ? data.photos[0].src.original : null;
  } catch (error) {
    console.error("Erro na função fetchPexelsImage:", error);
    return null; 
  }
}

async function displayFlights() {
  try {
    await loadAirports();

    const exchangeRate = await fetchExchangeRate();
    if (!exchangeRate) {
      console.error("Não foi possível obter a cotação do euro");
      return;
    }

    const userLocation = await getUserLocation();
    console.log("Localização do usuário:", userLocation);

    const nearestAirport = findNearestAirport(userLocation.latitude, userLocation.longitude);
    console.log("Aeroporto mais próximo:", nearestAirport);

    if (!nearestAirport) {
      console.error("Nenhum aeroporto encontrado nas proximidades.");
      return;
    }

    const origin = nearestAirport.iata; 
    const destination = "RIO"; 

    const flightsData = await fetchFlights(origin, destination, "2024-11-10", 1);
    const flights = flightsData.data.slice(0, 12);

    const carousel = document.querySelector(".flight-carousel");
    carousel.innerHTML = "";

    flights.forEach((flight) => {
      const priceInEur = flight.price.total;
      const priceInBrl = (priceInEur * exchangeRate).toFixed(2);

      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <h3>${flight.itineraries[0].segments[0].departure.iataCode} - ${flight.itineraries[0].segments[0].arrival.iataCode}</h3>
        <p>Preço: €${priceInEur} / R$${priceInBrl}</p>
        <p>Embarque: ${flight.itineraries[0].segments[0].departure.iataCode}</p>
        <p>Destino: ${flight.itineraries[0].segments[0].arrival.iataCode}</p>
        <p>Classe: ${flight.travelerPricings[0].fareFamilies}</p>
      `;

      carousel.appendChild(card);
    });

    $(".flight-carousel").slick({
      slidesToShow: 3,
      slidesToScroll: 1,
      infinite: true,
      dots: false,
      arrows: false,
      autoplay: true,
      autoplaySpeed: 2000,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
          },
        },
      ],
    });
  } catch (error) {
    console.error("Erro ao buscar voos:", error);
  }
}

displayFlights();
