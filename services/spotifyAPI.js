const { LanguageCode } = require("speakmaster-module-builder");
const { SelectOption } = require("speakmaster-module-builder/preferences-builder");

const { compareStrings } = require("../utils/utils");
const { activePlaylists, loginButton, playlistsOrder } = require("../preferences");

/**
 * @enum {string}
 */
const SearchType = Object.freeze({
	ALBUM: "ALBUM",
	ARTIST: "ARTIST"
});

class SpotifyAPI {
	/**
	 * Store the logged user
	 * @type {SpotifyApi.CurrentUsersProfileResponse}
	 */
	#loggedUser = null;

	/**
	 * Store the authenticated Spotify Web API instance
	 * @type {import("spotify-web-api-node")}
	 */
	#spotifyApi = null;

	/**
	 * Are the playlists being loaded now?
	 * @type {boolean}
	 */
	#isLoadingData = false;

	/**
	 * User's enabled playlists
	 * @type {SpotifyApi.PlaylistObjectSimplified[]}
	 */
	#availablePlaylists = [];

	/**
	 * List of tracks by playlist
	 * @type {Record<string, SpotifyApi.PlaylistTrackObject[]>}}
	 */
	#playlistTracks = {};

	get isAuthenticated () {
		return Boolean(this.#loggedUser && this.#loggedUser.id && this.#spotifyApi && this.#spotifyApi.getAccessToken());
	}

	/**
	 * Register the authenticated Spotify Web API instance and the logged user
	 * @param {import("spotify-web-api-node")} api Spotify Web API instance
	 * @param {SpotifyApi.CurrentUsersProfileResponse} user Logged user
	 */
	setSpotifyAPI (api, user) {
		this.#spotifyApi = api;
		this.#loggedUser = user;

		loginButton.label = "Usuário autenticado: " + user.display_name;
		loginButton.buttonText = "Trocar Conta";
		loginButton.buttonIcon = "logout";

		this.#loadAvailablePlaylists();
	}

	logout () {
		this.#spotifyApi = null;
		this.#loggedUser = null;
	}

	/**
	 * Identify what song the user requested and play it
	 * @param {string} id song's ID
	 * @param {string} uri uri of the album or playlist that the track is part of
	 * @param {boolean} onlyAddToQueue add a song to the queue instead of playing it now
	 * @returns {Promise<{ played: boolean, tracks: SpotifyApi.PlaylistTrackObject[] }> } `true` if the song was played or added to the queue
	 */
	async playByID (id, uri, onlyAddToQueue = false) {
		let played = false;
		try {
			if (onlyAddToQueue)
				await this.addTrackToQueue(id);
			else
				await this.playTrack(id, uri);

			played = true;
		} catch (error) {
			console.error(error);
		}

		return { played, tracks: [{ id, uri }] };
	}

	/**
	 * Play the specified track
	 * @param {string} trackId track identifier
	 * @param {string} [contextUri] uri of the album or playlist that the track is part of
	 * @returns {Promise<any>}
	 */
	async playTrack (trackId, contextUri) {
		return this.#spotifyApi.play({
			context_uri: contextUri,
			offset: { uri: `spotify:track:${trackId}` }
		});
	}

	/**
	 * Add the specified track to the queue
	 * @param {string} trackId track identifier
	 * @returns {Promise<any>}
	 */
	async addTrackToQueue (trackId) {
		return this.#spotifyApi.addToQueue(`spotify:track:${trackId}`);
	}

	/**
	 * Identify what song the user requested and play it
	 * @param {string} song song's name from user's input
	 * @param {SearchType} [searchBy] type of search (ALBUM, ARTIST)
	 * @param {string} [target] name of the album or artist from user's input
	 * @param {boolean} [onlyAddToQueue] add a song to the queue instead of playing it now
	 * @returns {Promise<{ played: boolean, tracks: SpotifyApi.PlaylistTrackObject[] }>} songs that match the command
	 */
	async play (song, searchBy = undefined, target = undefined, onlyAddToQueue = false) {
		let possibleSongs = [];

		// If the playlists and tracks are loaded
		if (!this.#isLoadingData) {
			for (const playlistID of playlistsOrder.value) {
				possibleSongs = possibleSongs.concat(
					this.#filterTracks(this.#playlistTracks[playlistID], song, searchBy, target, possibleSongs).map(song => {
						song.track.uri = this.#availablePlaylists.find(p => p.id === playlistID).uri || song.track.album.uri;
						return song;
					})
				);
			}
		}

		try {
			// If no tracks from user's playlists matched the user's input
			// search on Spotify for possible tracks according to song and, if specified, artist
			if (possibleSongs.length === 0) {
				const queries = [`track:${song}`];
				if (searchBy === SearchType.ALBUM)
					queries.unshift(`track:${song} album:${target}`);
				else if (searchBy === SearchType.ARTIST)
					queries.unshift(`track:${song} artist:${target}`);

				for (const searchStr of queries) {
					const data = await this.#searchTracks(searchStr);
					const tracks = data.body.tracks.items.map(track => ({
						track: {
							duration_ms: track.duration_ms,
							album: {
								id: track.album.id,
								name: track.album.name,
								uri: track.album.uri,
								images: track.album.images
							},
							artists: track.artists.map(a => ({
								id: a.id,
								name: a.name
							})),
							id: track.id,
							name: track.name
						}
					}));

					possibleSongs = possibleSongs.concat(
						this.#filterTracks(tracks, song, searchBy, target, possibleSongs).map(song => {
							song.track.uri = song.track.album.uri;
							return song;
						})
					);

					if (possibleSongs.length > 0)
						break;
				}
			}
		} catch (error) {
			console.error(error);
		}

		// Sort matched tracks by most relevant and best fit
		possibleSongs.sort((a, b) => {
			const byCoefficient = a.coefficient > b.coefficient ? -1 : (a.coefficient < b.coefficient ? 1 : 0);
			const byStrictCoefficient = a.strictCoefficient > b.strictCoefficient ? -1 : (a.strictCoefficient < b.strictCoefficient ? 1 : 0);
			return byCoefficient !== 0 ? byCoefficient : byStrictCoefficient;
		});

		let played = false;
		try {
			// Play the track that is most likely to be the one the user requested
			const songToPlay = possibleSongs.length > 0 ? possibleSongs[0] : null;
			if (songToPlay && songToPlay.track && songToPlay.track.id) {
				if (onlyAddToQueue)
					await this.addTrackToQueue(songToPlay.track.id);
				else
					await this.playTrack(songToPlay.track.id, songToPlay.track.uri);

				played = true;
			}
		} catch (error) {
			console.error(error);
		}

		return { played, tracks: possibleSongs.map(song => song.track) };
	}

	/**
	 * Search tracks on Spotify
	 * @param {string} searchQuery search query to be used
	 * @returns {Promise<Response<SpotifyApi.SearchResponse>>}
	 */
	#searchTracks (searchQuery) {
		return this.#spotifyApi.searchTracks(searchQuery);
	}

	/**
	 * Load the user's playlists taking the user's preferences into account
	 * @returns {Promise<void>}
	 */
	async #loadAvailablePlaylists () {
		this.#isLoadingData = true;

		try {
			this.#availablePlaylists = await this.#getPlaylists();

			// Load playlists
			activePlaylists.options = this.#availablePlaylists.map(
				p => new SelectOption(p.id)
					.addTranslation(p.name, `${p.tracks.total} songs`, [LanguageCode.EN_US, LanguageCode.EN_GB])
					.addTranslation(p.name, `${p.tracks.total} músicas`, [LanguageCode.PT_BR, LanguageCode.PT_PT])
			);

			// Update playlists order according to available playlists
			activePlaylists.changes.on("value", activePlaylistIDs => {
				// Keep only active playlists
				const orderedValues = playlistsOrder.value.filter(item => activePlaylistIDs.includes(item));

				// Add recently activated playlists to the ordered list
				playlistsOrder.list = activePlaylists.options
					.filter(option => activePlaylists.value.includes(option.value))
					.sort((a, b) => {
						const aIndex = orderedValues.includes(a.value) ? orderedValues.indexOf(a.value) : Infinity;
						const bIndex = orderedValues.includes(b.value) ? orderedValues.indexOf(b.value) : Infinity;
						return aIndex - bIndex;
					});

				// Update playlists order value based on the generated list
				playlistsOrder.value = playlistsOrder.list.map(option => option.value);

				// Load tracks of active playlists
				this.#loadAvailableTracks();
			});

			// Keep only available playlists
			activePlaylists.value = activePlaylists.value.filter(playlistID => activePlaylists.options.some(option => option.value === playlistID));
		} catch (error) {
			console.error("Error loading playlists. Retry in 5s.", error);
			setTimeout(this.#loadAvailablePlaylists, 5000);
		}
	}

	/**
	 * Retrieve user's playlists
	 * @returns {Promise<SpotifyApi.PlaylistObjectSimplified[]>}
	 */
	#getPlaylists () {
		return this.#paginationHandler(async offset => {
			const playlists = await this.#spotifyApi.getUserPlaylists({ offset, limit: 50 });
			return playlists.body;
		});
	}

	/**
	 * Load tracks of user's playlists
	 * @returns {Promise<void>}
	 */
	async #loadAvailableTracks () {
		console.log("Loading playlist's tracks:", activePlaylists.value);
		this.#isLoadingData = true;
		for (const playlistID of activePlaylists.value) {
			if (!this.#playlistTracks[playlistID])
				this.#playlistTracks[playlistID] = await this.#getPlaylistTracks(playlistID);
		}

		this.#isLoadingData = false;
		console.log("Finished loading playlist's tracks.");
	}

	/**
	 * Retrieve the tracks of a playlist
	 * @param {string} playlistID playlist identifier
	 * @returns {Promise<SpotifyApi.PlaylistTrackObject[]>}
	 */
	async #getPlaylistTracks (playlistID) {
		const fields = "limit,next,items(track(name,id,album(name,id,images),artists,duration_ms))";
		return this.#paginationHandler(async offset => {
			const tracks = await this.#spotifyApi.getPlaylistTracks(playlistID, { offset, fields, limit: 50 });

			tracks.body.items = tracks.body.items.reduce((result, item) => {
				if (!item.track)
					return result;

				item.track.artists = item.track.artists.map(a => ({ id: a.id, name: a.name }));
				result.push(item);
				return result;
			}, []);

			return tracks.body;
		});
	}

	/**
	 * Handle pagination on a call to the spotify API endpoint returning the full results
	 * @param {function (): Promise<any>} apiCall function that calls the Spotify API
	 * @returns {Promise<Array<any>>}
	 */
	async #paginationHandler (apiCall) {
		let data;
		let offset = 0;
		let result = [];

		do {
			data = await apiCall(offset);

			result = result.concat(data.items);
			offset += data.limit;
		} while (data.next);

		return result;
	}

	/**
	 * Filter a set of tracks based on the user's input
	 * @param {SpotifyApi.PlaylistTrackObject[]} tracks tracks of interest
	 * @param {string} song song's name from user's input
	 * @param {SearchType} [searchBy] type of search (ALBUM, ARTIST)
	 * @param {string} [target] name of the album or artist from user's input
	 * @param {Array<{ track: SpotifyApi.PlaylistTrackObject }>} [currentTracks] tracks that are already selected
	 * @returns {Array<{ track: SpotifyApi.PlaylistTrackObject, coefficient: number, strictCoefficient: number }>}
	 */
	#filterTracks (tracks, song, searchBy, target, currentTracks = []) {
		const possibleSongs = [];
		for (const { track } of tracks) {
			// In order to filter songs keeping those that may include some
			// extra information about the track in the title, the `nameSimilarity` coefficient
			// doesn't take in consideration any parentheses in the track's title.
			// So a track with the title "Let Me Go (feat. Chad Kroeger)" would also be evaluated as "Let Me Go".

			// In order to sort tracks by the most relevant,
			// the `strictNameSimilarity` coefficient is used. This way, the track
			// most similar to the user's input will be at the top of the list.

			const nameSimilarity = compareStrings(track.name, song, true);
			const strictNameSimilarity = compareStrings(track.name, song);

			let targetSimilarity = -1;
			let featuringArtistSimilarity = -1;
			let strictFeaturingArtistSimilarity = -1;

			if (target) {
				if (searchBy === SearchType.ALBUM) {
					targetSimilarity = compareStrings(track.album.name, target);
				} else if (searchBy === SearchType.ARTIST && track.artists) {
					targetSimilarity = track.artists.reduce(
						(coefficient, artist) => Math.max(coefficient, compareStrings(artist.name, target)), 0
					);

					featuringArtistSimilarity = compareStrings(track.name, `${song} ${target}`, true);
					strictFeaturingArtistSimilarity = compareStrings(track.name, `${song} ${target}`);
				}
			}

			// Find coefficient's average

			let totalWeight = 3;
			let sumCoefficients = 3 * (nameSimilarity > featuringArtistSimilarity ? nameSimilarity : featuringArtistSimilarity);
			let strictSumCoefficients = 3 * (strictNameSimilarity > strictFeaturingArtistSimilarity ? strictNameSimilarity : strictFeaturingArtistSimilarity);

			if (searchBy) {
				sumCoefficients += 2 * targetSimilarity;
				strictSumCoefficients += 2 * targetSimilarity;
				totalWeight += 2;
			}

			if (targetSimilarity !== -1) {
				// A total mismatch of artist must be enough to remove the track, if it is being used
				if (targetSimilarity < 0.2 && nameSimilarity > featuringArtistSimilarity)
					sumCoefficients = 0;
			}

			const finalCoefficient = sumCoefficients / totalWeight;
			const strictFinalCoefficient = strictSumCoefficients / totalWeight;

			// Tracks that match the user's input at least 70% in the non-strict comparison will be allowed
			if (finalCoefficient > 0.69 && !currentTracks.some(t => t.track.id === track.id)) {
				possibleSongs.push({
					track,
					coefficient: finalCoefficient,
					strictCoefficient: strictFinalCoefficient
				});
			}
		}

		return possibleSongs;
	}
}

const spotifyAPI = new SpotifyAPI();
module.exports = spotifyAPI;
