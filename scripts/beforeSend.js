"use strict";

//Variable zum �bergeben der Tab-Id
let tid = 0;
//Speichert das Promise ab
let promiseMap = new Map();
//Addon-Button deaktivieren (Abfrage ergibt erst beim Senden Sinn)
browser.composeAction.disable();


//Listener f�r Versenden der Mail
browser.compose.onBeforeSend.addListener(tab => {
    //Addon-Button beim Versenden aktiveren und Abfrage �ffnen
    browser.composeAction.enable(tab.id);
    browser.composeAction.openPopup();
    //Promise erstellen und speichern
    return new Promise(resolve => {
        promiseMap.set(tab.id, resolve);
    });
});


//Listener f�r Empfang der Nachricht von popup.js
browser.runtime.onMessage.addListener(message => {
    let resolve = promiseMap.get(message.tabId);
    //console.log(message);
    if (!resolve) {
        return;
    }
    //Addon-Button wieder deaktivieren
    browser.composeAction.disable(message.tabId);
    //Abbruch des Versands, wenn R�ckgabe des Promise aus compose.onBeforeSend.addListener mit cancel:true, sonst wird gesendet
    if (message.send) {
        resolve();
    } else {
        resolve({ cancel: true });
    }
});