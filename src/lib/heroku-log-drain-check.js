/**
 * @typedef {import("../../typings/n-express").HerokuLogDrainHealthcheckOptions} HerokuLogDrainHealthcheckOptions
 * @typedef {import("../../typings/n-express").NextHealthLogDrainResponse} NextHealthLogDrainResponse
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
const { UpstreamServiceError } = require('@dotcom-reliability-kit/errors');
const nHealth = require('n-health');

/**
 * @param {NextHealthLogDrainResponse} [jsonResponse]
 * @returns {boolean}
 */
const logDrainVerification = (jsonResponse) => {
	if (!jsonResponse?.status?.hasOwnProperty('ok')) {
		throw new UpstreamServiceError({
			code: 'NEXT_HEALTH_LOG_DRAIN_PROXY_ERROR',
			message: 'Unable to parse log drain response from next-health',
			relatesToSystems: ['next-health'],
			jsonResponse
		});
	}
	return jsonResponse.status.ok;
};

/**
 * @param {HerokuLogDrainHealthcheckOptions?} [opts]
 * @returns {Healthcheck & TickingMetric}
 */
module.exports = (opts) => {
	opts = opts || {};

	const region = process.env.REGION === 'US' ? 'us' : 'eu';

	const logDrainStatusUrl = `https://ft-next-health-eu.herokuapp.com/log-drains/${opts.herokuAppId}`;

	return nHealth.runCheck({
		id: `heroku-log-drain-${region}`,
		name: `Heroku log drain configured (${region.toUpperCase()})`,
		type: 'json',
		severity: 2,
		businessImpact: 'No user impact. Logs will not be collected in Splunk for this system in the event of the app crashing, making it harder to diagnose the cause.',
		panicGuide: 'Verify the log drain configuration. Contact #cp-reliability if you need help.',
		technicalSummary: 'Connects to next-health which reports on the status of log drains.',
		interval: '1hour',
		url: logDrainStatusUrl,
		callback: logDrainVerification,
		checkResult: {
			PASSED: 'Log drain is configured correctly.',
			FAILED: `Log drain configuration is bad. Visit ${logDrainStatusUrl} for details.`,
			ERRORED: 'Log drain check has errored.',
			PENDING: 'Log drain check is pending, check back soon.'
		}
	});
};
