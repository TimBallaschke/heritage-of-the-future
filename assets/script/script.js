document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#language-switcher > div').forEach(item => {
        item.addEventListener('click', () => {
            item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

    const playButton = document.getElementById('play-button');
    if (playButton) {
        playButton.addEventListener('click', () => {
            playButton.classList.toggle('playing');
        });
    }
});
