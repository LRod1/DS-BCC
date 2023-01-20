"use strict;"
//1 von 3
trusted_domains_save.addEventListener("click", savePrefs);
bcc_check.addEventListener("click", savePrefs);
auto_complete.addEventListener("click", savePrefs);
key_check.addEventListener("click", savePrefs);
bcc_limit.addEventListener("click", savePrefs);
stats_clear.addEventListener("click", clear);
loadPrefs();
loadLocalTxt();

const BCC_LIMIT = 4;

async function getPref() {
	return await browser.storage.local.get();
}

async function loadPrefs() {
	try {
		//2 von 3
		getPref().then((prefs) => {
			console.log(prefs);
			//trusted_domains laden und als String f�r das Input-Feld aufbereiten
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
		"bcc_limit": 4
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
	if (bcc_limit.value < 3 || bcc_limit.value > 20) bcc_limit.value = BCC_LIMIT;
	let options = {
		"bcc_check": bcc_check.checked,
		"auto_complete": auto_complete.checked,
		"key_check": key_check.checked,
		"bcc_limit": bcc_limit.value,
		"domain_list": domain_list
	};
	console.log(options);
	browser.storage.local.set(options);
}


function setButtonsToTrue() {
	bcc_check.checked = true;
	auto_complete.checked = true;
	key_check.checked = false;
	bcc_limit.value = BCC_LIMIT;
}

function setButtonsToPrefs(prefs) {
	bcc_check.checked = prefs.bcc_check;
	auto_complete.checked = prefs.auto_complete;
	key_check.checked = prefs.key_check;
	if (prefs.hasOwnProperty("bcc_limit")) bcc_limit.value = prefs.bcc_limit;
	else bcc_limit.value = BCC_LIMIT;
}

//Pr�ft die Liste der vertrauensw�rdigen Domains auf korrektes Format
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


//L�scht Statistiken
function clear() {
	browser.storage.local.clear();
	setButtonsToTrue();
}


//i18n
function loadLocalTxt() {
	headline.textContent = browser.i18n.getMessage("options_title");
	trusted_dom_hl.textContent = browser.i18n.getMessage("options_trusted_dom_hl");
	trusted_domains_save.textContent = browser.i18n.getMessage("options_trusted_domains_save");
	trusted_domains_descr.textContent = browser.i18n.getMessage("options_trusted_domains_descr");
	bcc_head.textContent = browser.i18n.getMessage("options_bcc_head");
	bcc_descr.textContent = browser.i18n.getMessage("options_bcc_descr");
	autocompl_head.textContent = browser.i18n.getMessage("options_autocompl_head");
	autocompl_descr.textContent = browser.i18n.getMessage("options_autocompl_descr");
	pgp_head.textContent = browser.i18n.getMessage("options_pgp_head");
	pgp_descr.textContent = browser.i18n.getMessage("options_pgp_descr");
	limit_head.textContent = browser.i18n.getMessage("options_limit_head");
	limit_descr.textContent = browser.i18n.getMessage("options_limit_descr");
	clear_local.textContent = browser.i18n.getMessage("options_delete_head");
	stats_clear.textContent = browser.i18n.getMessage("options_delete_button");
}