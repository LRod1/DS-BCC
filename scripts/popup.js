"use strict";
//Popup beim Lesen von emfpangenen Mails - Aufruf über beforeSend.js


//Wenn Warnung: Klick auswerten
addEventListener("click", async (event) => {
    let send = false;
    if (event.target.id.startsWith("choice")) {
        //Ok gewählt
        if (event.target.id.startsWith("choiceOK")) {
            send = true;
        }
        //Ok und Empf in BCC
        if (event.target.id.startsWith("choiceBCC")) {
            send = true;
            allRecpToBcc(all_recp_bcc, new Array());
        }
        //Ok oder Abbruch
        returnWarningResult(send);
    }
});


//Tab ID speichern, wird in bcc_check geladen
let tid;
let all_recp_bcc;
loadLocalTxt();
bcc_check();


async function bcc_check() {
    //Default-Schwellenwert für Rundmail-Größe
    const BCC_LIMIT = 4;
    //Schwellenwert für externe Empfänger, später aus Menü?
    const BCC_EXT_DOMS = 2;
    //E-Mail-Details und Preferences laden
    Promise.all([loadComposeDetails(), loadPreferences(), returnAddressbook()])
    .then(([details, prefs, addbooks]) => {

        console.log(prefs);

        let bcc_limit;
        if (prefs.hasOwnProperty("bcc_limit")) bcc_limit = prefs.bcc_limit;
        else bcc_limit = BCC_LIMIT;

        let send = true;
        //Empfänger ermitteln, auflösen von Adresslisten
        let to_recp = returnAddressArray(addbooks, details.to);
        let cc_recp = returnAddressArray(addbooks, details.cc);
        let bcc_recp = returnAddressArray(addbooks, details.bcc);
        let to_and_cc_recp = to_recp.concat(cc_recp);

        //Variable zum zählen von Domains, die nicht im Optionsmenü als trusted domains gespeichert wurden
        let ext_doms = returnExtDomains(to_and_cc_recp, prefs);
        let ext_bcc_doms = returnExtDomains(bcc_recp, prefs);

        //Soll auf Rundmails ohne BCC geprüft werden?
        if (!prefs.hasOwnProperty("bcc_check") || prefs.bcc_check) {
            //Rundmail-Schwellenwert mit to/cc Überschritten (>4) && externe Empfänger (nicht trusted) >= Schwellenwert (2)? Bei 1 siehe Warnung "auto_complete"
            if (to_and_cc_recp.length > bcc_limit && ext_doms >= BCC_EXT_DOMS) {
                if (prefs.hasOwnProperty("bcc_move_recp") && prefs.bcc_move_recp) {
                    //TODO: Empfänger automatisch in BCC verschieben
                    let recp_length = to_and_cc_recp.length;
                    bcc_recp = allRecpToBcc(to_and_cc_recp, bcc_recp);
                    to_and_cc_recp = new Array();
                    to_recp = new Array();
                    cc_recp = new Array();
                    browser.notifications.create("moved to bcc", {
                        "type": "basic",
                        "title": "Sichere Rundmails-Addon",
                        "message": "Empfänger in Blindkopie bewegt: " + recp_length
                    });
                    send = true;
                    document.getElementById("choiceBCC").disabled = true;
                } else {
                    document.getElementById("warning_bcc").textContent = browser.i18n.getMessage("popup_warning_bcc");
                    send = false;
                    all_recp_bcc = bcc_recp.concat(to_and_cc_recp);
                }
            } else document.getElementById("choiceBCC").remove();
        } else document.getElementById("choiceBCC").remove();

        //Soll auf einzelne externe Empfänger in internen Rundmails geprüft werden?
        if (!prefs.hasOwnProperty("auto_complete") || prefs.auto_complete) {
            //Rundmail-Größe erreicht (> 4)?
            if (to_and_cc_recp.length + bcc_recp.length > bcc_limit) {
                //Warnen, wenn Rundmail-Größe (>4) mit nur einer externen Domain (bei 2+ siehe "bcc_check")
                if (ext_doms + ext_bcc_doms == 1) {
                    document.getElementById("warning_autocomplete").textContent = browser.i18n.getMessage("popup_warning_autocomplete");
                    send = false;
                }
            }
        }

        //Ohne Umweg über Promise versenden, wenn sonst keine Warnungen
        //Wenn send == true, wurde keine Warnung erzeugt -> sofort Nachricht versenden; sonst auf click-Event warten
        if (send) returnWarningResult(send);
    });
}


//Schließen des Warn-Popups und senden des Ergebnisses an beforeSend.js
function returnWarningResult(send) {
    let tabId = tid;
    //Nachricht zurück an beforeSend.js
    browser.runtime.sendMessage({ tabId, send });
    //Nicht sofort schließen, da sonst Promise unfulfilled
    setTimeout(() => {
        window.close();
    }, 100);

    //TODO: Zeit auf 0 wenn keine Abfrage
}


function allRecpToBcc(to_and_cc_recp, bcc_recp) {
    let bcc = bcc_recp.concat(to_and_cc_recp);
    let recp = {
        "bcc": bcc,
        "to": "",
        "cc": ""
    };
    if (tid != "undefined") browser.compose.setComposeDetails(tid, recp);
    return bcc;
}


//Anzahl Domains, die nicht in trusted domains gespeichert sind
function returnExtDomains(recp_list, prefs) {
    let ext_doms = 0;
    for (let i = 0; i < recp_list.length; i++) {
        //E-Mail-Domains ermitteln
        let recp = recp_list[i];
        let mail_index = recp.lastIndexOf("<");
        if (mail_index != -1) {
            recp = recp_list[i].slice(mail_index);
            recp = recp.replace(">", "");
        }
        let recp_dom = "@" + recp.split("@")[1];
        //Ist Domain in trusted domains?
        if (!prefs.hasOwnProperty("domain_list") || !prefs.domain_list.includes(recp_dom)) {
            //console.log("domain nicht in trusted: " + recp_dom);
            //Zählen, wenn keine trusted domains gespeichert sind oder diese Domain nicht in der Liste ist
            ext_doms++;
        }
        else console.log("domain in trusted: " + recp_dom);
    }
    return ext_doms;
}


//Adressbuch laden
function returnAddressbook() {
    return browser.addressBooks.list(true);
}


//Empfänger-Array mit aufgelösten Adressen aus Addresslisten zurückgeben
function returnAddressArray(addbooks, recp_array) {
    let addresses = new Array();
    recp_array.forEach(recp => {
        //Einzelne Adresse
        if (recp.match(/.*@.*\..*/)) addresses.push(recp);
        //Sonst: Addressliste
        else {
            let res_recp = returnAddresses(addbooks, recp);
            addresses = addresses.concat(res_recp);
        }
    });
    return addresses;
}


//Adressbuch auflösen
function returnAddresses(addbooks, list) {
    let listname = list.match(/<.*>/g)[0].replace("<","").replace(">","");
    let addresses = new Array();
    addbooks.forEach(book => {
        //console.log(book.mailingLists.length);
        book.mailingLists.forEach(mailingList => {
            if (mailingList.name == listname) {
                mailingList.contacts.forEach(entry => {
                    addresses.push(entry.properties.PrimaryEmail);
                });
            }
        });
    });
    return addresses;
}


//Tab-ID laden
async function loadComposeDetails() {
    let tabs = await browser.tabs.query({ active: true, currentWindow: true });
    tid = tabs[0].id;
    return browser.compose.getComposeDetails(tabs[0].id);
}


//Preferences laden
function loadPreferences() {
    return browser.storage.local.get();
}


//Lokale Texte laden
function loadLocalTxt() {
    head.textContent = browser.i18n.getMessage("popup_head");
    send_quest.textContent = browser.i18n.getMessage("popup_send_quest");
    choiceOK.textContent = browser.i18n.getMessage("popup_choiceOK");
    choiceBCC.textContent = browser.i18n.getMessage("popup_choiceBCC");
    choiceCancel.textContent = browser.i18n.getMessage("popup_choiceCancel");
}