// esse é o display card do site
const clientId = "k2wiffvdlH3Uhb05j7NGyw2GrO6rzY4E";
const clientSecret = "4UtBaRC3A15aODsi";
const exchangeRateApiKey = "f0a82d5f3400636152941e1a";

async function getAuthToken() {
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

  const data = await response.json();
  return data.access_token;
}

async function fetchFlights(origin, destination, departureDate, adults) {
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

  return await response.json();
}

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
    console.error(error);
    return null;
  }
}

async function displayFlights() {
  const exchangeRate = await fetchExchangeRate(); 
  if (!exchangeRate) {
    console.error("Não foi possível obter a cotação do euro");
    return;
  }

  const flightsData = await fetchFlights("SAO", "RIO", "2024-11-10", 1);
  const flights = flightsData.data.slice(0, 12);

  const carousel = document.querySelector(".flight-carousel");
  carousel.innerHTML = "";

  flights.forEach((flight) => {
    const priceInEur = flight.price.total;
    const priceInBrl = (priceInEur * exchangeRate).toFixed(2);

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
<img src="${
  flight.lastPrice?.logo || "default.jpg"
}" alt="Viagem" class="card-img">
<h3>${flight.itineraries[0].segments[0].departure.iataCode} - ${
      flight.itineraries[0].segments[0].arrival.iataCode
    }</h3>
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
}

displayFlights();