<?php
// Home: open at the first room, first artwork
$homePage          = $page;
$initialRoomIndex  = 0;
$initialTrackIndex = 0;
snippet('player', compact('homePage', 'initialRoomIndex', 'initialTrackIndex'));
