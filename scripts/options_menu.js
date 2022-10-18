"use strict;"
//1 von 3
trusted_domains_save.addEventListener("click", savePrefs);
bcc_check.addEventListener("click", savePrefs);
auto_complete.addEventListener("click", savePrefs);
key_check.addEventListener("click", savePrefs);
stats_clear.addEventListener("click", clear);
loadPrefs();



async function getPref() {
	return await browser.storage.local.get();
}

async function loadPrefs() {
	try {
		//2 von 3
		getPref().then((prefs) => {
			console.log(prefs);
			//trusted_domains laden und als String für das Input-Feld aufbereiten
			if (prefs.hasOwnProperty("domain_list")) {
				let domain_string = "";
				prefs.domain_list.forEach(entry => {
					if (domain_string != "") domain_string += ", ";
					domain_string += entry;
				});
				trusted_domains.value = domain_string;
			}
			//Buttons setzen
			if (!prefs.hasOwnProperty("bcc_check")) {
				//Kein Wert -> Default
				setDefaultPrefs();
				console.log("Defaults gesetzt");
			} else {
				//Wert: aus Prefs laden
				setButtonsToPrefs(prefs);
				console.log("Buttons gesetzt");
			}
		});
		console.log("Preferences geladen");
	} catch (e) {
		console.log("Fehler: ");
		console.log(e);
	}
}

function setDefaultPrefs() {
	let options = {
		"bcc_check": true,
		"auto_complete": true,
		"key_check": false,
	};
	setButtonsToTrue();
	//Default-Prefs speichern
	browser.storage.local.set(options);
}

function savePrefs() {
	let domain_list = checkTrustedDomains(trusted_domains.value);
	console.log(domain_list);
	if (domain_list.length == 0) {
		getPref("domain_list").then((dl) => {
			domain_list = dl;
		});
	}
	//3 von 3
	let options = {
		"bcc_check": bcc_check.checked,
		"auto_complete": auto_complete.checked,
		"key_check": key_check.checked,
		"domain_list": domain_list
	};
	console.log(options);
	browser.storage.local.set(options);
}


function setButtonsToTrue() {
	bcc_check.checked = true;
	auto_complete.checked = true;
	key_check.checked = true;
}

function setButtonsToPrefs(prefs) {
	bcc_check.checked = prefs.bcc_check;
	auto_complete.checked = prefs.auto_complete;
	key_check.checked = prefs.key_check;
}

//Prüft die Liste der vertrauenswürdigen Domains auf korrektes Format
function checkTrustedDomains(val) {
	let domain_list = new Array();
	let domains = val.replace(" ", "");
	domains = domains.split(",");
	domains.forEach(domain => {
		let dm = domain.replace(" ", "");
		if (dm.match(/^@.*\..*/)) domain_list.push(domain);
	});
	return domain_list;
}


//Löscht Statistiken
function clear() {
	browser.storage.local.clear();
}