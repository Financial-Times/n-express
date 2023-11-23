/**
 * @typedef {import("../../typings/n-express").Callback} Callback
 */

/**
 * @param {string} systemCode
 * @returns {Callback}
 */
module.exports = function generateViaMiddleware (systemCode) {
	return (request, response, next) => {
		const requestVia = request.get('via');
		const appViaEntry = `${request.httpVersion} ${systemCode}`;
		response.set('via', requestVia ? `${requestVia}, ${appViaEntry}` : appViaEntry);
		next();
	};
};
