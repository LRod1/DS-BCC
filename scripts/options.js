"use strict";

//Listener f�r onClicked (browserAction = Button in Men�leiste) zum Starten des Optionsmen�s
browser.browserAction.onClicked.addListener((tab, info) => {
    console.log(`Click`);
    let properties = {
        active: true,
        url: "scripts/options_menu.html"
    }
    browser.tabs.create(properties);
});