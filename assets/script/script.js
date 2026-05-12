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

        audio.addEventListener('play', () => playButton.classList.add('playing'));
        audio.addEventListener('pause', () => playButton.classList.remove('playing'));
        audio.addEventListener('ended', () => playButton.classList.remove('playing'));
    }

    // --- Time display and progress fill ---
    const formatTime = seconds => {
        if (!isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const updateProgressFill = () => {
        if (!progressFill) return;
        if (isFinite(audio.duration) && audio.duration > 0) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${pct}%`;
        } else {
            progressFill.style.width = '0%';
        }
    };

    if (audio) {
        audio.addEventListener('loadedmetadata', () => {
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
            updateProgressFill();
        });

        audio.addEventListener('timeupdate', () => {
            if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            updateProgressFill();
        });

        audio.addEventListener('seeked', () => {
            if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
            updateProgressFill();
        });
    }

    // --- Seekbar interaction (click/drag) ---
    if (audio && progressBar) {
        const seekFromPointer = e => {
            const rect = progressBar.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const pct = rect.width > 0 ? x / rect.width : 0;

            if (progressFill) progressFill.style.width = `${pct * 100}%`;

            if (isFinite(audio.duration)) {
                const newTime = pct * audio.duration;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(newTime);
                audio.currentTime = newTime;
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

    // --- Translation + track navigation system ---
    let data = null;
    let activeLang = null;
    let activeTrackIndex = 0;
    let applying = false;

    const apply = (trackIndex, lang) => {
        if (!data || !data.languages[lang] || !data.tracks[trackIndex]) return;
        const track = data.tracks[trackIndex];
        const t = track.translations[lang];
        if (!t) return;
        if (lang === activeLang && trackIndex === activeTrackIndex) return;

        activeLang = lang;
        activeTrackIndex = trackIndex;
        applying = true;

        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            if (t.audioSrc && audio.src !== t.audioSrc) {
                audio.src = t.audioSrc;
            }
        }

        if (playButton) playButton.classList.remove('playing');
        if (progressFill) progressFill.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';

        if (artistsEl) artistsEl.innerHTML = t.artistName;
        if (artworkEl) artworkEl.innerHTML = t.artworkName;

        const langMeta = data.languages[lang];
        document.documentElement.lang = langMeta.lang;
        document.documentElement.dir = langMeta.dir;

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
        if (closest) apply(activeTrackIndex, closest.dataset.lang);
    };

    if (switcher) {
        let scrollTimer = null;
        switcher.addEventListener('scroll', () => {
            if (applying) return;
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(detectCenteredLanguage, 150);
        });
    }

    const prevButton = document.getElementById('previous-button');
    const nextButton = document.getElementById('next-button');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (!data || data.tracks.length === 0) return;
            const newIndex = (activeTrackIndex - 1 + data.tracks.length) % data.tracks.length;
            apply(newIndex, activeLang);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (!data || data.tracks.length === 0) return;
            const newIndex = (activeTrackIndex + 1) % data.tracks.length;
            apply(newIndex, activeLang);
        });
    }

    fetch('assets/data/translations.json')
        .then(r => r.json())
        .then(loaded => {
            data = loaded;
            apply(0, 'en');
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
