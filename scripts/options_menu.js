"use strict;"
//1 von 3
trusted_domains_save.addEventListener("click", savePrefs);
bcc_check.addEventListener("click", savePrefs);
auto_complete.addEventListener("click", savePrefs);
bcc_limit.addEventListener("click", savePrefs);
stats_clear.addEventListener("click", clear);
list_folders_button.addEventListener("click", listFolders);
del_button.addEventListener("click", deleteMails);
loadPrefs();
loadLocalTxt();
//listener, um Fehler beim Wechseln von Tabs zu vermeiden - listet ordner neu auf
let tab;
browser.tabs.onActivated.addListener(async (activeInfo) => {
	let t = await browser.tabs.getCurrent();
	let w = await browser.windows.getCurrent();
	tab = {tabId: t["id"], windowId: w["id"]};
	console.log(tab);
	console.log(activeInfo);
	if (activeInfo["tabId"] == tab["tabId"]) {
		listFolders();
		console.log("list");
	}
});

const BCC_LIMIT = 4;
const HGB_TIME = 6;
let folders_list = new Array(); //für das Löschen alter Mails

listFolders();

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
		"bcc_limit": bcc_limit.value,
		"domain_list": domain_list
	};
	console.log(options);
	browser.storage.local.set(options);
}

function setButtonsToTrue() {
	bcc_check.checked = true;
	auto_complete.checked = true;
	bcc_limit.value = BCC_LIMIT;
}

function setButtonsToPrefs(prefs) {
	bcc_check.checked = prefs.bcc_check;
	auto_complete.checked = prefs.auto_complete;
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


//Löschen alter Mails
//Ordner mit alten Mails auflisten
async function listFolders() {
	const listContainer = document.getElementById("list_container");
	listContainer.innerHTML = "";
	folders_list = new Array();
	const cutoff = document.getElementById("list_cutoff");
	cutoff.innerText = `${browser.i18n.getMessage("options_cut-off_date")}: ${getSixYearsAgo()}`;

	//Accounts abrufen
	let acc = await browser.accounts.list();
	acc.forEach(async (a) => {
		let folders = new Array();
		//Ornders der einzelnen Accounts abrufen
		let f = await browser.folders.getSubFolders(a);
		//Rekursiv Unterordner der einzelnen Accounts abrufen
		f.forEach(async (f) => await getSubs(f, folders));
		//Mails in den einzelnen Ordnern prüfen und ggf. zu folders hinzufügen und mit Index pro Account und Ordner versehen
		folders.forEach(async (item) => await checkFolder(listContainer, item));
	});
}

//rekursiv subfolder hinzufügen
async function getSubs(folder, folders) {
	folders.push(folder);
	folder["subFolders"].forEach((f) => getSubs(f, folders));
}

//Nachrichten im Ordner (item) auflisten und Eintrag samt Checkbox hinzufügen
async function checkFolder(listContainer, item) {
	let page = await browser.messages.list(item);
	//Nachrichten zählen
	let i = checkMails(page.messages);
	while (page.id) {
		page = await browser.messages.continueList(page.id);
		i += checkMails(page.messages);
	}
	if (i == 0) return;
	//hinzufügen, da > 0
	//AccountId + index als Bezeichner für Checkbox
	let indexConcat = item["accountId"] + item["path"];
	const listItem = document.createElement("div");
	let e1 = document.createElement("div");
	let e2 = document.createElement("div");
	let e3 = document.createElement("div");
	e1.innerText = indexConcat;
	e2.innerText = item.path;
	e3.innerText = i;
	listItem.innerHTML = `<input type="checkbox" id="checkbox${e1.innerText}" /> ${e2.innerText} - ${e3.innerText} ${browser.i18n.getMessage("options_messages")}`;
	listContainer.appendChild(listItem);
	folders_list.push(new Object({ obj: item, in: indexConcat }));
}

//Check Mails auf Datum
function checkMails(mails) {
	const sixYearsAgo = getSixYearsAgo();
	//Mails pro Ordner zählen, bei denen das Filterkriterium zutrifft
	let j = 0;
	mails.forEach((m) => {
		if (checkMail(m, sixYearsAgo)) {
			j++;
		}
	});
	return j;
}

//Prüfung auf einzelne Mail
function checkMail(m, sixYearsAgo) {
	if (m.date <= sixYearsAgo) {
		return true;
	}
	return false;
}

//Mails in ausgewählten Ordnern löschen
async function deleteMails() {
	const selectedItems = [];
	const sixYearsAgo = getSixYearsAgo();

	try {
		//Markierte Ordner sammeln
		folders_list.forEach((item) => {
			const checkbox = document.getElementById(`checkbox${item.in}`);
			if (checkbox.checked) {
				selectedItems.push(item.obj);
			}
		});

		//Mails in ausgewählten Ordnern löschen
		selectedItems.forEach(async (item) => {
			let del = new Array();

			//Prüfung der Mails in den Ordnern auf Kriterium aus checkMail
			let mails = await browser.messages.list(item);
			mails.messages.forEach(async (mail) => {
				if (checkMail(mail, sixYearsAgo)) del.push(mail.id);
			});

			while (mails.id) {
				mails = await browser.messages.continueList(mails.id);
				mails.messages.forEach(async (mail) => {
					if (checkMail(mail, sixYearsAgo)) del.push(mail.id);
				});
			}

			//false = papierkorb, true = vollständig löschen
			let i = del.length;
			await browser.messages.delete(del, false);
			document.getElementById("list_status").innerText = browser.i18n.getMessage("options_moved_to_trash") + i + " " + browser.i18n.getMessage("options_messages");
			listFolders();
		});
	} catch (err) {
		document.getElementById("list_status").innerText = err.message;
		listFolders();
	}
}

//Löschdatum nach HGB ermitteln
function getSixYearsAgo() {
	// Aktuelles Datum
	const currentDate = new Date();
	// Berechne das Datum vor 1 Jahr
	const oneYearAgo = new Date(currentDate);
	oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
	oneYearAgo.setMonth(11); // Setze den Monat auf Dezember
	oneYearAgo.setDate(31); // Setze den Tag auf den 31. Dezember
	oneYearAgo.setHours(23);
	oneYearAgo.setMinutes(59);
	oneYearAgo.setSeconds(59);
	// Berechne das Datum vor 6 Jahren ab dem 31. Dezember des Vorjahres
	const sixYearsAgo = new Date(oneYearAgo);
	sixYearsAgo.setFullYear(oneYearAgo.getFullYear() - HGB_TIME);
	return sixYearsAgo;
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
	limit_head.textContent = browser.i18n.getMessage("options_limit_head");
	limit_descr.textContent = browser.i18n.getMessage("options_limit_descr");
	clear_local.textContent = browser.i18n.getMessage("options_delete_head");
	stats_clear.textContent = browser.i18n.getMessage("options_delete_button");
	list_folders.textContent = browser.i18n.getMessage("options_list_folders");
	list_folders_button.textContent = browser.i18n.getMessage("options_list_folders_button");
	del_button.textContent = browser.i18n.getMessage("options_delete_selected_button");
}