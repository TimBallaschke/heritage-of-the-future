document.addEventListener('DOMContentLoaded', () => {
    const switcher = document.getElementById('language-switcher');
    const artistsEl = document.getElementById('artists-names');
    const artworkEl = document.getElementById('artwork-name');
    const playButton = document.getElementById('play-button');
    const audio = document.getElementById('audio');
    const progressBar = document.getElementById('seekbar-progress');
    const progressFill = document.getElementById('seekbar-progress-fill');
    const currentTimeEl = document.getElementById('seekbar-time-current');
    const totalTimeEl = document.getElementById('seekbar-time-total');

    // --- Click-to-center on language items ---
    document.querySelectorAll('#language-switcher > [data-lang]').forEach(item => {
        item.addEventListener('click', () => {
            item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

    // --- Audio playback ---
    if (playButton && audio) {
        playButton.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
        });

        audio.addEventListener('play', () => {
            playButton.classList.add('playing');
            if (progressFill && isFinite(audio.duration) && audio.duration > 0) {
                const pct = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = `${pct}%`;
            }
        });
        audio.addEventListener('pause', () => playButton.classList.remove('playing'));
        audio.addEventListener('ended', () => playButton.classList.remove('playing'));
    }

    // --- Time display ---
    if (audio && currentTimeEl && totalTimeEl) {
        const formatTime = seconds => {
            if (!isFinite(seconds)) return '0:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
            currentTimeEl.textContent = formatTime(audio.currentTime);
            if (progressFill && isFinite(audio.duration) && audio.duration > 0) {
                const pct = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = `${pct}%`;
            }
        });
    }

    // --- Seekbar interaction (click/drag) ---
    if (audio && progressBar) {
        const seekFromPointer = e => {
            const rect = progressBar.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const pct = rect.width > 0 ? x / rect.width : 0;
            if (isFinite(audio.duration)) {
                audio.currentTime = pct * audio.duration;
            }
        };

        let dragging = false;

        progressBar.addEventListener('pointerdown', e => {
            dragging = true;
            progressBar.setPointerCapture(e.pointerId);
            seekFromPointer(e);
        });

        progressBar.addEventListener('pointermove', e => {
            if (dragging) seekFromPointer(e);
        });

        const endDrag = e => {
            dragging = false;
            if (progressBar.hasPointerCapture(e.pointerId)) {
                progressBar.releasePointerCapture(e.pointerId);
            }
        };

        progressBar.addEventListener('pointerup', endDrag);
        progressBar.addEventListener('pointercancel', endDrag);
    }

    // --- Translation system ---
    let translations = null;
    let activeLang = null;
    let applying = false;

    const applyLanguage = lang => {
        if (!translations || !translations[lang] || lang === activeLang) return;
        activeLang = lang;
        applying = true;

        const t = translations[lang];

        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            if (t.audioSrc && audio.src !== t.audioSrc) {
                audio.src = t.audioSrc;
            }
        }

        if (artistsEl) artistsEl.innerHTML = t.artistName;
        if (artworkEl) artworkEl.innerHTML = t.artworkName;

        document.documentElement.lang = t.lang;
        document.documentElement.dir = t.dir;

        const activeItem = switcher && switcher.querySelector(`[data-lang="${lang}"]`);
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
        }

        setTimeout(() => { applying = false; }, 150);
    };

    const detectCenteredLanguage = () => {
        if (!switcher || applying) return;
        const switcherRect = switcher.getBoundingClientRect();
        const centerX = switcherRect.left + switcherRect.width / 2;
        let closest = null;
        let closestDist = Infinity;
        switcher.querySelectorAll('[data-lang]').forEach(item => {
            const r = item.getBoundingClientRect();
            const dist = Math.abs(r.left + r.width / 2 - centerX);
            if (dist < closestDist) {
                closest = item;
                closestDist = dist;
            }
        });
        if (closest) applyLanguage(closest.dataset.lang);
    };

    if (switcher) {
        let scrollTimer = null;
        switcher.addEventListener('scroll', () => {
            if (applying) return;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(detectCenteredLanguage, 150);
        });
    }

    fetch('assets/data/translations.json')
        .then(r => r.json())
        .then(data => {
            translations = data;
            applyLanguage('en');
        })
        .catch(err => console.error('Failed to load translations:', err));

    // --- Initial centering of default language (English) ---
    const defaultLang = document.getElementById('language-switcher-english');
    if (defaultLang) {
        const centerDefault = () => {
            defaultLang.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
        };
        centerDefault();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(centerDefault);
        }
    }
});
