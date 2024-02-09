"use strict";

//Variable zum Übergeben der Tab-Id
let tid = 0;
//Speichert das Promise ab
let promiseMap = new Map();
//Addon-Button deaktivieren (Abfrage ergibt erst beim Senden Sinn)
browser.composeAction.disable();


//Listener fur Versenden der Mail
browser.compose.onBeforeSend.addListener(tab => {
    //Addon-Button beim Versenden aktiveren und Abfrage öffnen
    browser.composeAction.enable(tab.id);
    browser.composeAction.openPopup();
    //Promise erstellen und speichern
    return new Promise(resolve => {
        promiseMap.set(tab.id, resolve);
    });
});


//Listener für Empfang der Nachricht von popup.js
browser.runtime.onMessage.addListener(message => {
    let resolve = promiseMap.get(message.tabId);
    //console.log(message);
    if (!resolve) {
        return;
    }
    //Addon-Button wieder deaktivieren
    browser.composeAction.disable(message.tabId);
    //Abbruch des Versands, wenn Rückgabe des Promise aus compose.onBeforeSend.addListener mit cancel:true, sonst wird gesendet
    if (message.send) {
        resolve();
    } else {
        resolve({ cancel: true });
    }
});