const clientId = "k2wiffvdlH3Uhb05j7NGyw2GrO6rzY4E"; 
const clientSecret = "4UtBaRC3A15aODsi"; 

const unsplashAccessKey = "W2HBqgxYqZ7KAnZZYo0Jr-UR138EtYcUUQZVRdVSxXU"; 
const exchangeRateApiKey = "f0a82d5f3400636152941e1a";

async function fetchExchangeRate() {
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/latest/EUR`
    );

    if (!response.ok) {
      throw new Error("Erro ao obter a cotação do euro");
    }

    const data = await response.json();
    return data.conversion_rates.BRL; 
  } catch (error) {
    console.error("Erro:", error);
    return null;
  }
}

async function getAuthToken() {
  try {
    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro ao obter o token de autenticação:", errorData);
      throw new Error("Erro ao obter o token: " + errorData.message);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erro:", error);
    throw new Error("Erro ao obter token: " + error.message);
  }
}

async function fetchDestinationImage(destination) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${destination}&client_id=${unsplashAccessKey}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar a imagem do destino:", error);
    return null;
  }
}

async function fetchAirlineImage(airlineName) {
  const query = `${airlineName} logo`;
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&client_id=${unsplashAccessKey}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar a imagem da companhia aérea:", error);
    return null;
  }
}

async function fetchCountryFlag(country) {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${country} flag&client_id=${unsplashAccessKey}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar a imagem da bandeira:", error);
    return null;
  }
}

async function fetchFlights(origin, destination, departureDate, adults) {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("Token de autenticação não obtido");
    }

    console.log("Token de Autenticação:", token);

    const formattedDepartureDate = new Date(departureDate)
      .toISOString()
      .split("T")[0];
    console.log("Data formatada:", formattedDepartureDate);

    const response = await fetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${formattedDepartureDate}&adults=${adults}`, // Adicionando o número de adultos
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro na requisição:", errorData);
      throw new Error("Erro ao buscar os voos: " + errorData.errors[0].detail);
    }

    const data = await response.json();
    const destinationImageUrl = await fetchDestinationImage(destination);
    displayFlights(data.data, destinationImageUrl);
  } catch (error) {
    console.error("Erro:", error);
    document.getElementById("flight-results").innerHTML =
      '<p class="text-red-500">Erro ao buscar os voos. Tente novamente.</p>';
  }

  console.log("Origem:", origin);
  console.log("Destino:", destination);
}

$(document).ready(function () {
  $("#flight-search-form").on("submit", function (event) {
    event.preventDefault();

    const origin = $("#origin").val();
    const destination = $("#destination").val();
    const departureDate = $("#departure-date").val();
    const adults = $("#adults").val();
    fetchFlights(origin, destination, departureDate, adults);
  });
});

async function displayFlights(flights, destinationImageUrl) {
  const resultsContainer = document.getElementById("flight-results");
  resultsContainer.innerHTML = "";

  const exchangeRate = await fetchExchangeRate();
  if (!exchangeRate) {
    resultsContainer.innerHTML =
      '<p class="text-red-500">Erro ao obter a taxa de câmbio. Tente novamente.</p>';
    return;
  }

  for (const flight of flights) {
    const price = flight.price.total;
    const currency = flight.price.currency;

    const priceInBRL =
      currency === "EUR" ? (price * exchangeRate).toFixed(2) : price;

    const departure = flight.itineraries[0].segments[0].departure;
    const arrival = flight.itineraries[0].segments.slice(-1)[0].arrival;

    const airlineName = flight.itineraries[0].segments[0].carrierCode;

    const airlineImageUrl = await fetchAirlineImage(airlineName);

    const flightCard = document.createElement("div");
    flightCard.classList.add(
      "bg-white",
      "shadow-lg",
      "rounded-lg",
      "p-4",
      "mb-4",
      "flex",
      "items-center"
    );

    const imageUrl = destinationImageUrl || "URL_FALLBACK_DA_IMAGEM";

    const imageElement = `
            <img src="${imageUrl}" alt="Destino" class="w-24 h-24 rounded-lg mr-4">
          `;

    const flightInfo = `
            <div class="flex-grow">
              <h2 class="text-xl font-bold mb-2">${arrival.iataCode} (${
      arrival.at.split("T")[0]
    })</h2>
              <p class="text-gray-500 mb-1">Partida: ${departure.iataCode} (${
      departure.at.split("T")[0]
    })</p>
              <p class="text-gray-500 mb-1">Chegada: ${arrival.iataCode} (${
      arrival.at.split("T")[0]
    })</p>
              <p class="text-gray-700 font-bold mb-1">Preço: R$ ${priceInBRL}</p>
            </div>
          `;

    const airlineInfo = `
            <div class="text-right">
              <img src="${
                airlineImageUrl || "URL_DO_LOGO_DA_COMPANHIA"
              }" alt="Companhia" class="w-12 h-12 mb-2 mx-auto">
              <p class="text-sm font-semibold">${airlineName}</p>
              <p class="text-xs text-gray-500">Econômica</p>
            </div>
          `;

    flightCard.innerHTML = `
            <div class="flex">
              ${imageElement}
              ${flightInfo}
              ${airlineInfo}
            </div>
          `;

    resultsContainer.appendChild(flightCard);
  }

  if (resultsContainer.innerHTML === "") {
    resultsContainer.innerHTML =
      '<p class="text-gray-500">Nenhum voo encontrado.</p>';
  }
}
