const preferences = require("../preferences");
const spotifyAPI = require("../services/spotifyAPI");

/**
 * Registra a lista de funcionalidades disponíveis para controle do teclado
 * @param {import("speakmaster-module-connection").ModuleConnection} connection
 */
function registerSpotifyControl (connection) {
	// Features
	connection.registerFeature("play", play);

	// Preferences
	connection.registerPreference(preferences.activePlaylists);
	connection.registerPreference(preferences.loginButton);
	connection.registerPreference(preferences.playlistsOrder);

	preferences.loginButton.changes.on("value", async event => {
		if (!event || !event.clickSignal)
			return;

		if (spotifyAPI.isAuthenticated) {
			// TODO: implement logout
			console.log("Logout");
			return;
		}

		console.log("Start login:", event);
		const { default: open } = await import("open");
		open(process.env.SPOTIFY_LOGIN_URI);
	});
}

/**
 * Start playing a specific song
 */
async function play ({ id, uri, song, searchBy, target, onlyAddToQueue }) {
	if (!spotifyAPI.isAuthenticated)
		return false;

	try {
		let result;
		if (id) {
			if (!uri)
				return false; // Parameter 'uri' is missing

			result = await spotifyAPI.playByID(id, uri, (onlyAddToQueue || "").toString() === "TRUE");
		} else {
			if (!song)
				return false; // Parameter 'song' is missing

			result = await spotifyAPI.play(song, searchBy, target, (onlyAddToQueue || "").toString() === "TRUE");
		}

		if (result.tracks.length > 1) {
			// Ambiguity detected
			return result.tracks.map(track => ({
				value: { id: track.id, uri: track.uri },
				description: track.name + (track.artists.length > 0 ? ` - ${track.artists[0].name}` : ""),
				image: _getImg(track.album.images),
				secondaryInfo: _formatSongDuration(track.duration_ms)
			}));
		}

		return result.played;
	} catch (error) {
		// Error occurred while playing song
		console.error(error);
		return false;
	}
}

function _getImg (images) {
	let image = images[0];
	for (let i = 0; i < images.length; i++) {
		if (image.height <= 128) {
			if (images[i].height <= 128 && images[i].height > image.height)
				image = images[i];
		} else if (images[i].height <= image.height) {
			image = images[i];
		}
	}

	return image ? image.url : undefined;
}

function _formatSongDuration (ms) {
	const minutes = Math.floor(ms / 60000);
	const seconds = ((ms % 60000) / 1000).toFixed(0);
	return `${minutes}:${seconds.padStart(2, "0")}`;
}

module.exports = { registerSpotifyControl };
