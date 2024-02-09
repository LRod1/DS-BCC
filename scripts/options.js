"use strict";

//Listener für onClicked (browserAction = Button in Menüleiste) zum Starten des Optionsmenüs
browser.browserAction.onClicked.addListener((tab, info) => {
    console.log(`Click`);
    let properties = {
        active: true,
        url: "scripts/options_menu.html"
    }
    browser.tabs.create(properties);
});