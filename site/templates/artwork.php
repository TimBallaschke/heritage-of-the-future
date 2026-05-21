<?php
// Artwork: render the player with this artwork as initial state
$roomPage = $page->parent();
$homePage = $roomPage ? $roomPage->parent() : site()->homePage();
if (!$homePage) {
    go(site()->homePage()->url());
    return;
}

$initialRoomIndex = 0;
$idx = 0;
foreach ($homePage->children()->listed() as $r) {
    if ($r->is($roomPage)) { $initialRoomIndex = $idx; break; }
    $idx++;
}

$initialTrackIndex = 0;
$idx = 0;
foreach ($roomPage->children()->listed()->sortBy('number', 'asc') as $a) {
    if ($a->is($page)) { $initialTrackIndex = $idx; break; }
    $idx++;
}

snippet('player', compact('homePage', 'initialRoomIndex', 'initialTrackIndex'));
