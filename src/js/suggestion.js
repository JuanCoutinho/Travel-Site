let aeroportos = [];
let codigoIATAEmbarque = '';
let codigoIATADestino = '';

function carregarAeroportos() {
    fetch('https://airports-api-production-c3da.up.railway.app/api/aeroportos')
        .then(response => response.json())
        .then(data => {
            aeroportos = data;
        })
        .catch(error => console.error('Erro ao carregar os aeroportos:', error));
}

window.onload = carregarAeroportos;

function mostrarSugestoes(inputElement, suggestionsElement, tipo) {
    const inputValue = inputElement.value.toLowerCase();
    suggestionsElement.innerHTML = '';

    if (inputValue) {
        const filtrados = aeroportos.filter(aeroporto => {
            const nameMatches = aeroporto.name && aeroporto.name.toLowerCase().includes(inputValue);
            const cityMatches = aeroporto.municipality && aeroporto.municipality.toLowerCase().includes(inputValue);
            const stateMatches = aeroporto.iso_region && aeroporto.iso_region.toLowerCase().includes(inputValue);
            const isNotHeliport = aeroporto.type && !aeroporto.type.toLowerCase().includes('heliport');
            const isNotHelipad = aeroporto.type && !aeroporto.type.toLowerCase().includes('helipad');
            const hasIATA = aeroporto.iata_code;

            return (nameMatches || cityMatches || stateMatches) && isNotHeliport && isNotHelipad && hasIATA;
        }).slice(0, 5);

        filtrados.forEach(aeroporto => {
            const div = document.createElement('div');
            div.classList.add('suggestion');
            div.textContent = `${aeroporto.name} (${aeroporto.iata_code})`;
            div.onclick = () => {
                inputElement.value = `${aeroporto.name} (${aeroporto.iata_code})`;
                suggestionsElement.innerHTML = '';

                if (tipo === 'embarque') {
                    codigoIATAEmbarque = aeroporto.iata_code;
                } else if (tipo === 'destino') {
                    codigoIATADestino = aeroporto.iata_code;
                }
            };
            suggestionsElement.appendChild(div);
        });
    }
}

document.getElementById('search1').addEventListener('input', function() {
    mostrarSugestoes(this, document.getElementById('suggestions1'), 'embarque');
});

document.getElementById('search2').addEventListener('input', function() {
    mostrarSugestoes(this, document.getElementById('suggestions2'), 'destino');
});

document.getElementById('flight-search-form').addEventListener('submit', function(event) {
    event.preventDefault();

    if (codigoIATAEmbarque && codigoIATADestino) {
        const departureDate = document.getElementById('departure-date').value;
        const adults = document.getElementById('adults').value;

        buscarVoos(codigoIATAEmbarque, codigoIATADestino, departureDate, adults);
    } else {
        alert('Por favor, selecione os aeroportos de embarque e destino.');
    }
});

function buscarVoos(embarque, destino, data, adultos) {
    console.log(`Buscando voos de ${embarque} para ${destino} em ${data} para ${adultos} adulto(s).`);
}