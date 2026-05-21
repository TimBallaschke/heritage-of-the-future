<?php
// Room: render the player UI with the visited room as initial state (track 0)
$homePage = $page->parent() ?? site()->homePage();
$rooms    = $homePage->children()->listed();

$initialRoomIndex = 0;
$idx = 0;
foreach ($rooms as $r) {
    if ($r->is($page)) { $initialRoomIndex = $idx; break; }
    $idx++;
}
$initialTrackIndex = 0;

snippet('player', compact('homePage', 'initialRoomIndex', 'initialTrackIndex'));
