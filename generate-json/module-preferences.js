const { LanguageCode } = require("speakmaster-module-builder");
const { ModulePreferencesBuilder, PreferenceGroup, EMPTY_PREFERENCE_SLOT } = require("speakmaster-module-builder/preferences-builder");

const { activePlaylists, loginButton, playlistsOrder } = require("../preferences");

const mouseSettings = new PreferenceGroup()
	.addPreferenceRow(loginButton, EMPTY_PREFERENCE_SLOT)
	.addPreferenceRow(activePlaylists, EMPTY_PREFERENCE_SLOT)
	.addPreferenceRow(playlistsOrder, EMPTY_PREFERENCE_SLOT)
	.addTranslation("Settings", [LanguageCode.EN_US, LanguageCode.EN_GB])
	.addTranslation("Configurações", [LanguageCode.PT_BR, LanguageCode.PT_PT]);

new ModulePreferencesBuilder()
	.addPreferenceGroup(mouseSettings)
	.generateJSON();
