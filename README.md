# Thunderbird_DSGVO-Addon
 Addon zum Vermeiden von Datenpannen beim Mailversand

## Permissions
* compose: Für den Versand nach BCC-Check (popup.js)
* storage: Für das Speichern und Laden der Preferences
* activeTab und tabs: Abfragen der ComposeDetails (popup.js)
* notifications: Für Popup beim Versand
* accountsFolders: Für das Auflisten der Ordner (options_menu.js)
* accountsRead: Für das Auflisten der Ordner (query) (options_menu.js)
* messagesRead: Für das Prüfen der Mails in den Ordnern (options_menu.js)
* messagesDelete: Für das Löschen der alten Mails (options_menu.js)