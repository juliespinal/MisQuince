let imagenListaParaEnviar = null;
let tipoArchivoActual = null;
let archivoVideoCrudo = null;

document.addEventListener("DOMContentLoaded", () => {
    const inputCamera = document.getElementById('inputCamera');
    const inputGallery = document.getElementById('inputGallery');
    const btnCamera = document.getElementById('btnCamera');
    const btnGallery = document.getElementById('btnGallery');

    if (btnCamera && inputCamera) {
        btnCamera.addEventListener('click', () => inputCamera.click());
        inputCamera.addEventListener('change', (e) => procesarSeleccion(e.target.files));
    }

    if (btnGallery && inputGallery) {
        btnGallery.addEventListener('click', () => inputGallery.click());
        inputGallery.addEventListener('change', (e) => procesarSeleccion(e.target.files));
    }

    inicializarHero();
});

function inicializarHero() {
    const video = document.getElementById('heroVideo');
    const fallback = document.getElementById('heroImageFallback');
    if (!video || !fallback) return;

    const tieneSource = video.querySelector('source');
    if (!tieneSource) {
        video.style.display = 'none';
        fallback.style.display = 'block';
        return;
    }

    video.addEventListener('error', () => {
        video.style.display = 'none';
        fallback.style.display = 'block';
    });
    video.addEventListener('loadeddata', () => {
        fallback.style.display = 'none';
    });
}

function mostrarLoader(texto) {
    const loaderMsg = document.querySelector('.loader-msg');
    const loaderModal = document.getElementById('loader-modal');
    if (loaderMsg) loaderMsg.innerText = texto;
    if (loaderModal) loaderModal.style.display = 'flex';
}

function ocultarLoader() {
    const loaderModal = document.getElementById('loader-modal');
    if (loaderModal) loaderModal.style.display = 'none';
}

function cerrarPreview() {
    const previewModal = document.getElementById('preview-modal');
    const inputCamera = document.getElementById('inputCamera');
    const inputGallery = document.getElementById('inputGallery');

    if (previewModal) previewModal.style.display = 'none';
    imagenListaParaEnviar = null;
    archivoVideoCrudo = null;
    if (inputCamera) inputCamera.value = '';
    if (inputGallery) inputGallery.value = '';

    const previewVid = document.getElementById('preview-vid');
    if (previewVid) {
        previewVid.pause();
        previewVid.remove();
    }
}

function procesarSeleccion(fileList) {
    if (!fileList || fileList.length === 0) return;

    if (fileList.length === 1) {
        procesarArchivoConPreview(fileList[0]);
    } else {
        procesarVariosArchivos(Array.from(fileList));
    }
}

function procesarArchivoConPreview(archivo) {
    tipoArchivoActual = archivo.type.startsWith('video/') ? 'video' : 'foto';

    mostrarLoader("Preparando vista previa...");

    if (tipoArchivoActual === 'video') {
        archivoVideoCrudo = archivo;
        const urlLocal = URL.createObjectURL(archivo);

        const previewImg = document.getElementById('preview-img');
        const previewModal = document.getElementById('preview-modal');

        if (previewImg) previewImg.style.display = 'none';

        let previewVid = document.getElementById('preview-vid');
        if (!previewVid) {
            previewVid = document.createElement('video');
            previewVid.id = 'preview-vid';
            previewVid.style.width = '100%';
            previewVid.style.maxHeight = '50vh';
            previewVid.style.borderRadius = '16px';
            previewVid.controls = true;
            const container = document.querySelector('.img-container');
            if (container) container.appendChild(previewVid);
        }
        previewVid.style.display = 'block';
        previewVid.src = urlLocal;

        ocultarLoader();
        if (previewModal) previewModal.style.display = 'flex';
    } else {
        comprimirImagen(archivo, 1600, 0.7, function (blobFinal) {
            imagenListaParaEnviar = blobFinal;
            const v = document.getElementById('preview-vid');
            if (v) v.remove();

            const previewImg = document.getElementById('preview-img');
            const previewModal = document.getElementById('preview-modal');

            if (previewImg) {
                previewImg.style.display = 'block';
                previewImg.src = URL.createObjectURL(blobFinal);
            }
            ocultarLoader();
            if (previewModal) previewModal.style.display = 'flex';
        });
    }
}

async function procesarVariosArchivos(archivos) {
    const confirmado = await UIModal.confirm({
        title: `¿Subir ${archivos.length} archivos?`,
        message: 'Se subirán todos al álbum de la fiesta.',
        confirmText: 'Sí, subir',
        cancelText: 'Cancelar'
    });

    if (!confirmado) {
        const inputGallery = document.getElementById('inputGallery');
        if (inputGallery) inputGallery.value = '';
        return;
    }

    UIModal.progress.show(`Subiendo 0 de ${archivos.length}`);
    let errores = 0;

    for (let i = 0; i < archivos.length; i++) {
        try {
            await subirArchivoACloudinary(archivos[i]);
        } catch (err) {
            errores++;
        }
        UIModal.progress.update(i + 1, archivos.length);
    }

    UIModal.progress.hide();

    const inputGallery = document.getElementById('inputGallery');
    if (inputGallery) inputGallery.value = '';

    if (errores === 0) {
        UIModal.notice(`¡${archivos.length} recuerdos subidos!`, { icon: 'fa-solid fa-champagne-glasses' });
    } else {
        UIModal.notice(`Se subieron ${archivos.length - errores} de ${archivos.length}. ${errores} fallaron.`, { isError: true });
    }
}

function subirFotoDefinitiva() {
    mostrarLoader("Subiendo recuerdo...");

    const archivo = tipoArchivoActual === 'video' ? archivoVideoCrudo : imagenListaParaEnviar;
    if (!archivo) return;

    subirArchivoACloudinary(archivo)
        .then(() => {
            ocultarLoader();
            const mensaje = tipoArchivoActual === 'video' ? '¡Video guardado!' : '¡Foto guardada!';
            UIModal.notice(mensaje, { icon: 'fa-solid fa-champagne-glasses' });
            cerrarPreview();
        })
        .catch(() => {
            ocultarLoader();
            const mensaje = tipoArchivoActual === 'video' ? 'Error al subir el video.' : 'Error al subir la foto.';
            UIModal.notice(mensaje, { isError: true });
        });
}

function subirArchivoACloudinary(archivo) {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('upload_preset', APP_CONFIG.uploadPreset);

    return fetch(`https://api.cloudinary.com/v1_1/${APP_CONFIG.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
    }).then(async res => {
        if (!res.ok) {
            const detalle = await res.json().catch(() => null);
            console.error('Cloudinary upload error:', res.status, detalle);
            throw new Error(detalle?.error?.message || 'Upload failed');
        }
        return res.json();
    }).then(data => {
        return registrarEnAppsScript(data).then(() => data);
    });
}

function registrarEnAppsScript(dataCloudinary) {
    const tipo = dataCloudinary.resource_type === 'video' ? 'video' : 'foto';
    const params = new URLSearchParams();
    params.append('url', dataCloudinary.secure_url);
    params.append('tipo', tipo);
    params.append('nombreArchivo', dataCloudinary.public_id);

    return fetch(APP_CONFIG.scriptURL, { method: 'POST', body: params })
        .catch(err => console.error('Error registrando en Apps Script:', err));
}

function comprimirImagen(archivo, maxWidth, calidad, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
            let width = img.width; let height = img.height;
            const ratio = Math.min(1, maxWidth / Math.max(width, height));
            const canvas = document.createElement('canvas');
            canvas.width = width * ratio; canvas.height = height * ratio;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(callback, 'image/jpeg', calidad);
        };
    };
}

window.cerrarPreview = cerrarPreview;
window.subirFotoDefinitiva = subirFotoDefinitiva;
