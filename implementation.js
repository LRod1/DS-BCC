XPCOMUtils.defineLazyModuleGetters(this, {
    BondOpenPGP: "chrome://openpgp/content/BondOpenPGP.jsm",
    EnigmailKeyRing: "chrome://openpgp/content/modules/keyRing.jsm"
});

var myapi = class extends ExtensionCommon.ExtensionAPI {
    getAPI(context) {
        return {
            myapi: {
                async hasKey(email_string) {
                    var has_all_keys = true;
                    var emails = email_string.split(";");
                    var key;
                    emails.forEach(email => {
                        key = EnigmailKeyRing.getKeysByEmail(email);
                        if (key.length == 0) has_all_keys = false;
                    });
                    return has_all_keys; //KeyObj definiert in openpgp/content/modules/keyObj.jsm
                },
            }
        }
    }
};