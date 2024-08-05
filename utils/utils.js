const { compareTwoStrings } = require("string-similarity");

/**
 * Compare values from the track information and the user's input
 * @param {string} reference text of the field being compared received from Spotify
 * @param {string} input part of user's transcript that is associated to the field being compared
 * @param {boolean} [removeParentheses] if `true` allow a less strict comparison
 * @returns {number} comparison coefficient
 */
function compareStrings (reference, input, removeParentheses = false) {
	reference = reference || "";
	const strictCoefficient = compareTwoStrings(reference.toLowerCase(), input.toLowerCase());
	if (!removeParentheses)
		return strictCoefficient;

	reference = reference.toLowerCase().replace(/\((.*?)\)/g, "");
	return Math.max(strictCoefficient, compareTwoStrings(reference, input.toLowerCase()));
}

/**
 * Generates a random string containing numbers and letters
 * @param {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString (length) {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (let i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

module.exports = { compareStrings, generateRandomString };
