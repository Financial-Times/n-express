/**
 * @typedef {import("../../typings/n-express").Callback} Callback
 */

const logger = require('@dotcom-reliability-kit/logger');
const sendRate = 0.05;

/**
 * @type {Callback}
 */
module.exports = (req, res, next) => {
	// Throttle sending of events until we know this is the correct implmentation
	if (Math.random() < sendRate) {
		res.on('finish', function () {
			/** @type {Record<string, string | undefined>} */
			let toLog = {
				event: 'RESPONSE_VARY',
				path: req.path
			};
			const vary = res.get('vary')?.replace(/ /g, '').split(',');

			if (!vary) {
				return;
			}

			vary.map((header) => {
				toLog[header] = req.get(header);
			});
			logger.warn(toLog);
		});
	}
	next();
};
