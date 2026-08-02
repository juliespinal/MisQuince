const contenedor = document.getElementById('galeria');
const loader = document.getElementById('loader-inicial');
const contador = document.getElementById('contadorRecuerdos');

let recursosCargados = new Set();
let esPrimeraCarga = true;

let urlActualParaCompartir = '';
let tipoActualParaCompartir = '';

function urlThumbnailVideo(url) {
    return url.replace(/\.(mp4|mov|webm)$/i, '.jpg');
}

async function cargarFotos() {
    try {
        const res = await fetch(APP_CONFIG.scriptURL);
        const data = await res.json();
        if (data.result !== 'success') return;

        if (esPrimeraCarga && loader) loader.style.display = 'none';

        data.fotos.slice().reverse().forEach(item => {
            if (recursosCargados.has(item.id)) return;
            recursosCargados.add(item.id);

            let el;
            if (item.tipo === 'video') {
                const wrapper = document.createElement('div');
                wrapper.className = "video-wrapper animate__animated animate__fadeIn";
                wrapper.onclick = () => abrirVisualizador(item.url, 'video');

                const img = document.createElement('img');
                img.src = urlThumbnailVideo(item.url);
                img.className = "foto-item";
                img.loading = "lazy";

                const icon = document.createElement('div');
                icon.className = "play-icon";
                icon.innerHTML = '<i class="fa-solid fa-play"></i>';

                wrapper.appendChild(img);
                wrapper.appendChild(icon);
                el = wrapper;
            } else {
                const img = document.createElement('img');
                img.src = item.url;
                img.className = "foto-item animate__animated animate__fadeIn";
                img.loading = "lazy";
                img.onclick = () => abrirVisualizador(item.url, 'foto');
                el = img;
            }
            contenedor.prepend(el);
        });

        if (contador) {
            const total = recursosCargados.size;
            contador.textContent = total > 0 ? `${total} recuerdo${total === 1 ? '' : 's'}` : '';
        }

        if (esPrimeraCarga && recursosCargados.size === 0) {
            mostrarEstadoVacio();
        } else if (recursosCargados.size > 0) {
            ocultarEstadoVacio();
        }

        esPrimeraCarga = false;
    } catch (err) {
        console.error("Error cargando recuerdos:", err);
        if (esPrimeraCarga && loader) loader.style.display = 'none';
    }
}

function mostrarEstadoVacio() {
    if (document.getElementById('emptyState')) return;
    const empty = document.createElement('div');
    empty.id = 'emptyState';
    empty.className = 'empty-state';
    empty.innerHTML = '<i class="fa-regular fa-images"></i><p>Todavía no hay recuerdos. ¡Sé el primero en subir uno!</p>';
    contenedor.appendChild(empty);
}

function ocultarEstadoVacio() {
    const empty = document.getElementById('emptyState');
    if (empty) empty.remove();
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
                title: 'Los 15 de Uma',
                text: '¡Mirá este recuerdo de la fiesta!',
                url: linkMagico
            });
        } catch (error) {
            console.log('Error compartiendo:', error);
        }
    } else {
        navigator.clipboard.writeText(linkMagico);
        UIModal.notice('Enlace copiado. ¡Ya podés compartirlo en redes o por mensajes!', { icon: 'fa-solid fa-link' });
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
setInterval(cargarFotos, APP_CONFIG.pollingIntervalMs);

window.abrirVisualizador = abrirVisualizador;
window.cerrarVisualizador = cerrarVisualizador;
window.compartirRecuerdo = compartirRecuerdo;
