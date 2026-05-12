document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#language-switcher > div').forEach(item => {
        item.addEventListener('click', () => {
            item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

    const playButton = document.getElementById('play-button');
    const audio = document.getElementById('audio');
    const progressBar = document.getElementById('seekbar-progress');
    const progressFill = document.getElementById('seekbar-progress-fill');
    const currentTimeEl = document.getElementById('seekbar-time-current');
    const totalTimeEl = document.getElementById('seekbar-time-total');

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
});
