<?php
/**
 * Shared player UI.
 *
 * Caller may set:
 *   $homePage          – defaults to the site home page
 *   $initialRoomIndex  – 0-based, defaults to 0
 *   $initialTrackIndex – 0-based, defaults to 0
 */
$homePage          = $homePage          ?? site()->homePage();
$initialRoomIndex  = $initialRoomIndex  ?? 0;
$initialTrackIndex = $initialTrackIndex ?? 0;

$languages = [];
foreach (kirby()->languages() as $lang) {
    $languages[$lang->code()] = [
        'lang' => $lang->code(),
        'dir'  => $lang->direction(),
    ];
}

$rooms = [];
foreach ($homePage->children()->listed() as $room) {
    $roomTrans = [];
    foreach (kirby()->languages() as $lang) {
        $roomTrans[$lang->code()] = [
            'name' => (string)$room->content($lang->code())->title(),
        ];
    }

    $colors = [
        'background' => (string)$room->background_color(),
        'image'      => (string)$room->image_color(),
        'font'       => (string)$room->font_color(),
    ];

    $tracks = [];
    foreach ($room->children()->listed()->sortBy('number', 'asc') as $artwork) {
        $artTrans = [];
        foreach (kirby()->languages() as $lang) {
            $c = $artwork->content($lang->code());
            $artTrans[$lang->code()] = [
                'artistName'  => (string)$c->artist_name(),
                'artworkName' => (string)$c->artwork_title(),
                'audioSrc'    => url((string)$c->audio_path()),
            ];
        }
        $tracks[] = [
            'id'           => $artwork->slug(),
            'number'       => (int)$artwork->number()->toInt(),
            'image'        => url((string)$artwork->image_path()),
            'translations' => $artTrans,
        ];
    }

    $rooms[] = [
        'id'           => $room->slug(),
        'number'       => $room->num() ?? (count($rooms) + 1),
        'translations' => $roomTrans,
        'colors'       => $colors,
        'tracks'       => $tracks,
    ];
}

// Clamp initial indices
$totalRooms = count($rooms);
$initialRoomIndex = max(0, min($initialRoomIndex, $totalRooms - 1));
$initialTrackCount = count($rooms[$initialRoomIndex]['tracks'] ?? []);
$initialTrackIndex = max(0, min($initialTrackIndex, $initialTrackCount - 1));

$pageData = [
    'languages'         => $languages,
    'rooms'             => $rooms,
    'initialRoomIndex'  => $initialRoomIndex,
    'initialTrackIndex' => $initialTrackIndex,
];

$currentLang = kirby()->language() ? kirby()->language()->code() : kirby()->defaultLanguage()->code();
$currentDir  = kirby()->language() ? kirby()->language()->direction() : 'ltr';

$initialRoom  = $rooms[$initialRoomIndex] ?? null;
$initialTrack = $initialRoom['tracks'][$initialTrackIndex] ?? null;
$initialArtist  = $initialTrack['translations'][$currentLang]['artistName']  ?? '';
$initialArtwork = $initialTrack['translations'][$currentLang]['artworkName'] ?? '';
$initialNumber  = $initialTrack['number'] ?? 1;
$initialColors  = $initialRoom['colors'] ?? ['background' => '', 'image' => '', 'font' => ''];
$initialBg      = $initialColors['background'] ?: '#dedddc';
$initialFont    = $initialColors['font']       ?: '#ff5cc3';
?>
<!DOCTYPE html>
<html lang="<?= $currentLang ?>" dir="<?= $currentDir ?>" style="--room-bg: <?= esc($initialBg) ?>; --room-color: <?= esc($initialFont) ?>;">
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
                <?php foreach ($rooms as $r): ?>
                    <div data-room="<?= esc($r['number']) ?>"><?= esc($r['translations'][$currentLang]['name'] ?? '') ?></div>
                <?php endforeach ?>
            </div>
        </div>
        <div id="room-selector-line-wrapper">
            <div id="room-selector-line"></div>
        </div>
        <div id="artists-names-wrapper">
            <div id="artists-names"><?= $initialArtist ?></div>
        </div>
        <div id="artwork-name-wrapper">
            <div id="artwork-number-wrapper">
                <div id="artwork-number"><?= esc($initialNumber) ?></div>
            </div>
            <div id="artwork-name"><?= $initialArtwork ?></div>
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
    <audio id="audio" preload="auto"></audio>
    <script type="application/json" id="page-data"><?= json_encode($pageData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
    <script src="<?= url('assets/script/script.js') ?>"></script>
</body>
</html>
