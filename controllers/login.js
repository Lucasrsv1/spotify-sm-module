const request = require("request");
const querystring = require("querystring");
const SpotifyWebApi = require("spotify-web-api-node");

const { resolve } = require("path");
const { writeFileSync, readFileSync, existsSync } = require("fs");

const spotifyAPI = require("../services/spotifyAPI");
const { generateRandomString } = require("../utils/utils");

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

const SCOPE = [
	"user-read-private",
	"user-read-email",
	"user-read-playback-state",
	"user-modify-playback-state",
	"user-read-currently-playing",
	"playlist-read-collaborative",
	"playlist-read-private"
].join(" ");

const STATE_KEY = "spotify_auth_state";

const tokenPath = resolve(__dirname, "..", "tokens.json");

class Login {
	/**
	 * Start the login process
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	login (req, res) {
		const state = generateRandomString(16);
		res.cookie(STATE_KEY, state);

		const params = querystring.stringify({
			response_type: "code",
			client_id: CLIENT_ID,
			scope: SCOPE,
			redirect_uri: REDIRECT_URI,
			state
		});

		// Requests authorization
		res.redirect("https://accounts.spotify.com/authorize?" + params);
	}

	/**
	 * Receive feedback from Spotify and finish logging in
	 * @param {import("express").Request} req
	 * @param {import("express").Response} res
	 */
	loginCallback (req, res) {
		const code = req.query.code || null;
		const state = req.query.state || null;
		const storedState = req.cookies ? req.cookies[STATE_KEY] : null;

		// Check the state parameter
		if (state === null || state !== storedState)
			return res.redirect("/api/v1/login?" + querystring.stringify({ error: "state_mismatch" }));

		res.clearCookie(STATE_KEY);
		const authOptions = {
			url: "https://accounts.spotify.com/api/token",
			form: {
				code,
				redirect_uri: REDIRECT_URI,
				grant_type: "authorization_code"
			},
			headers: {
				Authorization: "Basic " + (Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"))
			},
			json: true
		};

		// Requests refresh and access tokens
		request.post(authOptions, async (error, response, body) => {
			if (error || response.statusCode !== 200)
				return res.redirect("/api/v1/login?" + querystring.stringify({ error: "invalid_token" }));

			// Instantiate the API wrapper
			const spotifyWebApi = new SpotifyWebApi({
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				redirectUri: REDIRECT_URI
			});

			// Set up tokens
			spotifyWebApi.setAccessToken(body.access_token);
			spotifyWebApi.setRefreshToken(body.refresh_token);

			// Use the access token to access the Spotify Web API
			try {
				const data = await spotifyWebApi.getMe();
				spotifyAPI.setSpotifyAPI(spotifyWebApi, data.body);

				// Save the tokens to use when the app restarts
				writeFileSync(
					tokenPath,
					JSON.stringify({ access_token: body.access_token, refresh_token: body.refresh_token })
				);

				res.status(200).send("Done. You can now close this window.");
			} catch (error) {
				console.error(error);
				res.redirect("/api/v1/login?" + querystring.stringify({ error: "cannot_get_user" }));
			}
		});
	}

	async restoreSpotifyAPIFromJSON () {
		if (!existsSync(tokenPath))
			return;

		try {
			// Load saved tokens from JSON file
			const tokens = JSON.parse(readFileSync(tokenPath));

			// Instantiate the API wrapper
			const spotifyWebApi = new SpotifyWebApi({
				clientId: CLIENT_ID,
				clientSecret: CLIENT_SECRET,
				redirectUri: REDIRECT_URI
			});

			// Set up tokens
			spotifyWebApi.setAccessToken(tokens.access_token);
			spotifyWebApi.setRefreshToken(tokens.refresh_token);

			// Use the access token to access the Spotify Web API
			const data = await spotifyWebApi.getMe();
			spotifyAPI.setSpotifyAPI(spotifyWebApi, data.body);
		} catch (error) {
			console.error("Failed to restore Spotify API from JSON file:", error);

			// Start login process since the saved tokens are invalid or expired
			const { default: open } = await import("open");
			open(process.env.SPOTIFY_LOGIN_URI);
		}
	}
}

const loginController = new Login();
loginController.restoreSpotifyAPIFromJSON();

module.exports = loginController;
