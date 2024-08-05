const { LanguageCode } = require("speakmaster-module-builder");
const {
	ActionButtonColor,
	ActionButtonPosition,
	ActionButtonPreference,
	MultiSelectPreference,
	SortedListPreference
} = require("speakmaster-module-builder/preferences-builder");

const loginButton = ActionButtonPreference.create({
	identifier: "login",
	color: ActionButtonColor.WARNING,
	position: ActionButtonPosition.RIGHT,
	dynamicLabel: true,
	dynamicButtonTextAndIcon: true,
	label: "Nenhum usuário autenticado",
	buttonText: "Login",
	buttonIcon: "login"
});

const activePlaylists = MultiSelectPreference.create({
	identifier: "activePlaylists",
	dynamicOptions: true,
	dynamicValue: true
})
	.addTranslation("Searchable playlists:", [LanguageCode.EN_US, LanguageCode.EN_GB])
	.addTranslation("Playlists usadas na pesquisa:", [LanguageCode.PT_PT, LanguageCode.PT_BR]);

const playlistsOrder = SortedListPreference.create({
	identifier: "playlistsOrder",
	dynamicList: true,
	dynamicValue: true
})
	.addTranslation("Playlist search order:", [LanguageCode.EN_US, LanguageCode.EN_GB])
	.addTranslation("Ordem de pesquisa nas playlists:", [LanguageCode.PT_PT, LanguageCode.PT_BR]);

module.exports = { loginButton, activePlaylists, playlistsOrder };
