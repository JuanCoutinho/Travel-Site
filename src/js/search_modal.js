const searchButton = document.getElementById('searchButton');
const searchModal = document.getElementById('searchModal');
const closeButton = document.querySelector('.close-button');

// Abrir modal quando o botão de pesquisa é clicado
searchButton.onclick = function() {
  searchModal.style.display = 'block';
}

// Fechar modal quando o botão de fechar é clicado
closeButton.onclick = function() {
  searchModal.style.display = 'none';
}

// Fechar modal quando o usuário clica fora do modal
window.onclick = function(event) {
  if (event.target === searchModal) {
    searchModal.style.display = 'none';
  }
}

// Adicionar ação ao botão de buscar
document.getElementById('searchSubmit').onclick = function() {
  const query = document.getElementById('searchInput').value;
  alert('Você buscou: ' + query); // Aqui você pode implementar a lógica de busca
  searchModal.style.display = 'none'; // Fecha o modal após a busca
}