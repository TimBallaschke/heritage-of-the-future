<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page->title() ?></title>
    <link rel="stylesheet" href="https://use.typekit.net/hrz6qlq.css">
    <link rel="stylesheet" href="<?= url('assets/style/style.css') ?>">
</head>
<body>
    <canvas id="background-canvas"></canvas>
    <div id="content">
        <div id="room-switcher-wrapper">
            <div id="room-switcher">
                <div data-room="1">Room 1</div>
                <div data-room="2">Room 2</div>
                <div data-room="3">Room 3</div>
            </div>
        </div>
        <div id="room-selector-line-wrapper">
            <div id="room-selector-line"></div>
        </div>
        <div id="artists-names-wrapper">
            <div id="artists-names">Sharon<br>Golan</div>
        </div>
        <div id="artwork-name-wrapper">
            <div id="artwork-number-wrapper">
                <div id="artwork-number">1</div>
            </div>
            <div id="artwork-name">Space<br>of Collective<br>Memory</div>
        </div>
        <div id="navigation-wrapper">
            <div id="navigation">
                <div id="seekbar-wrapper">
                    <div id="seekbar-time-wrapper">
                        <div id="seekbar-progress">
                            <div id="seekbar-progress-fill"></div>
                        </div>
                        <div id="seekbar-times">
                            <div id="seekbar-time-current">0:00</div>
                            <div id="seekbar-time-total">0:00</div>
                        </div>
                    </div>
                </div>
                <div id="playback-controls-wrapper">
                    <div id="playback-controls">
                        <div id="previous-button"></div>
                        <div id="play-button"></div>
                        <div id="next-button"></div>
                    </div>
                </div>
                <div id="selector-line-wrapper">
                    <div id="selector-line"></div>
                </div>
                <div id="language-switcher">
                    <div id="language-switcher-arabic" data-lang="ar">عربي</div>
                    <div id="language-switcher-english" data-lang="en">English</div>
                    <div id="language-switcher-hebrew" data-lang="he">עִברִית</div>
                </div>
            </div>
        </div>
    </div>
    <audio id="audio" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" preload="auto">
    <script src="<?= url('assets/script/script.js') ?>"></script>
</body>
</html>
