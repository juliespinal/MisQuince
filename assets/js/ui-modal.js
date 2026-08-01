const UIModal = (() => {
    function crearOverlay(innerHTML, { closable = true } = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'ui-modal-overlay';
        overlay.innerHTML = innerHTML;

        if (closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'ui-modal-close';
            closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            closeBtn.setAttribute('aria-label', 'Cerrar');
            overlay.querySelector('.ui-modal-card').appendChild(closeBtn);
            closeBtn.addEventListener('click', () => cerrar(overlay));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cerrar(overlay);
            });
        }

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('is-visible'));
        return overlay;
    }

    function cerrar(overlay) {
        overlay.classList.add('is-fading');
        overlay.classList.remove('is-visible');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }

    function notice(message, { icon = 'fa-solid fa-circle-check', isError = false, title = '', autoCloseMs = 3000 } = {}) {
        const iconClass = isError ? 'ui-modal-icon is-error' : 'ui-modal-icon';
        const iconFa = isError ? 'fa-solid fa-circle-exclamation' : icon;
        const overlay = crearOverlay(`
            <div class="ui-modal-card">
                <div class="${iconClass}"><i class="${iconFa}"></i></div>
                ${title ? `<h3 class="ui-modal-title">${title}</h3>` : ''}
                <p class="ui-modal-message">${message}</p>
            </div>
        `);

        if (autoCloseMs) {
            setTimeout(() => {
                if (document.body.contains(overlay)) cerrar(overlay);
            }, autoCloseMs);
        }
        return overlay;
    }

    function confirmar({ title = '¿Estás seguro?', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
        return new Promise((resolve) => {
            const overlay = crearOverlay(`
                <div class="ui-modal-card">
                    <h3 class="ui-modal-title">${title}</h3>
                    <p class="ui-modal-message">${message}</p>
                    <div class="ui-modal-actions">
                        <button class="ui-modal-btn is-cancel">${cancelText}</button>
                        <button class="ui-modal-btn is-confirm">${confirmText}</button>
                    </div>
                </div>
            `, { closable: true });

            const finalizar = (resultado) => {
                cerrar(overlay);
                resolve(resultado);
            };

            overlay.querySelector('.is-cancel').addEventListener('click', () => finalizar(false));
            overlay.querySelector('.is-confirm').addEventListener('click', () => finalizar(true));
            overlay.querySelector('.ui-modal-close').addEventListener('click', () => resolve(false));
        });
    }

    let progressOverlay = null;

    const progress = {
        show(titulo = 'Subiendo...') {
            progressOverlay = crearOverlay(`
                <div class="ui-modal-card">
                    <div class="ui-modal-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                    <h3 class="ui-modal-title" id="uiProgressTitle">${titulo}</h3>
                    <p class="ui-progress-count" id="uiProgressCount"></p>
                    <div class="ui-progress-track">
                        <div class="ui-progress-fill" id="uiProgressFill"></div>
                    </div>
                </div>
            `, { closable: false });
        },
        update(actual, total) {
            if (!progressOverlay) return;
            const pct = total > 0 ? Math.round((actual / total) * 100) : 0;
            const count = progressOverlay.querySelector('#uiProgressCount');
            const fill = progressOverlay.querySelector('#uiProgressFill');
            const title = progressOverlay.querySelector('#uiProgressTitle');
            if (count) count.textContent = `Subiendo ${actual} de ${total}`;
            if (fill) fill.style.width = pct + '%';
            if (title) title.textContent = actual >= total ? '¡Listo!' : 'Subiendo...';
        },
        hide() {
            if (progressOverlay) {
                cerrar(progressOverlay);
                progressOverlay = null;
            }
        }
    };

    return { notice, confirm: confirmar, progress };
})();

window.UIModal = UIModal;
