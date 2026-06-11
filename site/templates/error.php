<?php

$homePage = site()->homePage();

go($homePage ? $homePage->url() : url(), 302);
