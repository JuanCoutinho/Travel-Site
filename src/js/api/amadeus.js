const clientId = "k2wiffvdlH3Uhb05j7NGyw2GrO6rzY4E"; 
const clientSecret = "4UtBaRC3A15aODsi"; 

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
      throw new Error("Erro ao obter o token: " + errorData.message);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    throw new Error("Erro ao obter token: " + error.message);
  }
}

async function fetchFlights(origin, destination, departureDate, adults) {
  try {
    const token = await getAuthToken();
    const formattedDepartureDate = new Date(departureDate).toISOString().split("T")[0];

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
      const errorData = await response.json();
      throw new Error("Erro ao buscar os voos: " + errorData.errors[0].detail);
    }

    return await response.json();
  } catch (error) {
    throw new Error("Erro ao buscar os voos: " + error.message);
  }
}

export { getAuthToken, fetchFlights };
