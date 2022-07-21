/**
 * @typedef {import("../../typings/n-express").HerokuLogDrainHealthcheckOptions} HerokuLogDrainHealthcheckOptions
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
const nHealth = require('n-health');

/**
 * @param {HerokuLogDrainHealthcheckOptions?} [opts]
 * @returns {Healthcheck & TickingMetric}
 */
module.exports = (opts) => {
	opts = opts || {};

	const region = process.env.REGION === 'US' ? 'us' : 'eu';

	return nHealth.runCheck({
		id: `heroku-log-drain-${region}`,
		name: 'Heroku log drain configured',
		type: 'herokuLogDrain',
		severity: opts.severity
	});
};
