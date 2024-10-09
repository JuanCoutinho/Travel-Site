const unsplashAccessKey = "W2HBqgxYqZ7KAnZZYo0Jr-UR138EtYcUUQZVRdVSxXU";

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
    return null;
  }
}

async function fetchAirlineImage(airlineName) {
  const query = `${airlineName} logo`;
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashAccessKey}`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.small;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export { fetchDestinationImage, fetchAirlineImage };
