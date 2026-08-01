const scriptURL = 'https://script.google.com/macros/s/AKfycbywW5vlsO6rF5okrfC9KTHvvvfnh9PqCVwozyf0f6SovR1MHOMue5oeyo28utE29GVd/exec';
const contenedor = document.getElementById('galeria');
const loader = document.getElementById('loader-inicial');

let fotosCargadas = new Set();
let esPrimeraCarga = true;

let urlActualParaCompartir = ''; 
let tipoActualParaCompartir = '';

function cargarFotos() {
    fetch(scriptURL)
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                if (esPrimeraCarga) loader.style.display = 'none';
                data.fotos.reverse().forEach(item => {
                    if (!fotosCargadas.has(item.id)) {
                        fotosCargadas.add(item.id);

                        let el;
                        if (item.tipo === 'video') {
                            const wrapper = document.createElement('div');
                            wrapper.className = "video-wrapper animate__animated animate__fadeIn";
                            wrapper.onclick = () => abrirVisualizador(item.url, 'video');

                            const img = document.createElement('img');
                            img.src = item.url.replace(/\.(mp4|mov|webm)$/i, '.jpg');
                            img.className = "foto-item";

                            const icon = document.createElement('div');
                            icon.className = "play-icon";
                            icon.innerHTML = "▶";

                            wrapper.appendChild(img);
                            wrapper.appendChild(icon);
                            el = wrapper;
                        } else {
                            const img = document.createElement('img');
                            img.src = item.url;
                            img.className = "foto-item animate__animated animate__fadeIn";
                            img.onclick = () => abrirVisualizador(item.url, 'foto');
                            el = img;
                        }
                        contenedor.prepend(el);
                    }
                });
                esPrimeraCarga = false;
            }
        })
        .catch(err => console.error("Error:", err));
}

function abrirVisualizador(url, tipo) {
    urlActualParaCompartir = url; 
    tipoActualParaCompartir = tipo;

    const modal = document.getElementById('viewerModal');
    const container = document.getElementById('viewerContainer');
    container.innerHTML = '';

    if (tipo === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.className = "viewer-content";
        video.controls = true;
        video.autoplay = true;
        container.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = url;
        img.className = "viewer-content";
        container.appendChild(img);
    }

    modal.style.display = 'flex';
}

function cerrarVisualizador() {
    document.getElementById('viewerModal').style.display = 'none';
    document.getElementById('viewerContainer').innerHTML = '';
    const urlLimpia = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, urlLimpia);
}
async function compartirRecuerdo() {
    const urlBase = window.location.origin + window.location.pathname;
    const linkMagico = `${urlBase}?media=${encodeURIComponent(urlActualParaCompartir)}&tipo=${tipoActualParaCompartir}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Mili & Juli - Boda',
                text: '¡Mirá este recuerdo de la fiesta!',
                url: linkMagico
            });
        } catch (error) {
            console.log('Error compartiendo:', error);
        }
    } else {
        navigator.clipboard.writeText(linkMagico);
        alert('Enlace copiado. ¡Ya podés compartirlo en redes o por mensajes!');
    }
}

function revisarUrlCompartida() {
    const parametros = new URLSearchParams(window.location.search);
    const mediaUrl = parametros.get('media');
    const tipoMedia = parametros.get('tipo');

    if (mediaUrl && tipoMedia) {
        setTimeout(() => {
            abrirVisualizador(decodeURIComponent(mediaUrl), tipoMedia);
        }, 300);
    }
}

revisarUrlCompartida();
cargarFotos();
setInterval(cargarFotos, 20000);

window.abrirVisualizador = abrirVisualizador;
window.cerrarVisualizador = cerrarVisualizador;
window.compartirRecuerdo = compartirRecuerdo;