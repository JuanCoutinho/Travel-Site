async function fetchAirportImage(airportName) {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(airportName)}&prop=pageimages`);
    const data = await response.json();
    
    const page = Object.values(data.query.pages)[0];
    return page && page.thumbnail ? page.thumbnail.source : null; // Retorna a URL da imagem ou null
  }
  
  export { fetchAirportImage };
  