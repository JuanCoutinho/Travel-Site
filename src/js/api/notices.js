$(document).ready(function() {
    $('.navbar a').on('click', function(e) {
        if (this.hash !== "") {
            e.preventDefault();
            const hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top - 50
            }, 800);
        }
    });

$('.carousel').slick({
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false 
});

    const apiKey = '2dcc59229e1448c395afc2222225fff8';
    const url = `https://newsapi.org/v2/everything?q=aviation&language=pt&apiKey=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const articles = data.articles;
            let newsHTML = '';

            articles.forEach((article, index) => {
                if (index < 5) {
                    newsHTML += `
                    <div class="carousel-item">
                        <img src="${article.urlToImage || 'default-image.jpg'}" alt="Imagem da Notícia">
                        <h3>${article.title}</h3>
                        <p>${article.description}</p>
                        <a href="${article.url}" target="_blank">Leia mais</a>
                    </div>
                    `;
                }
            });

            $('.carousel').slick('unslick'); 
            $('.carousel').html(newsHTML);   
            $('.carousel').slick({           
                infinite: true,
                slidesToShow: 3,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 3000,
                arrows: false
            });
        })
        .catch(error => console.error('Erro ao buscar notícias:', error));
});