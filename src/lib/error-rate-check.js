/**
 * @typedef {import("../../typings/n-express").ErrorRateHealthcheckOptions} ErrorRateHealthcheckOptions
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
const nHealth = require('n-health');

const DEFAULT_SEVERITY = 3;
const DEFAULT_SAMPLE_PERIOD = '10min';
const DEFAULT_THRESHOLD = 4;

/**
 * @param {string} appName
 * @param {ErrorRateHealthcheckOptions?} [opts]
 * @returns {Healthcheck & TickingMetric}
 */
module.exports = (appName, opts) => {
	opts = opts || {};
	const severity = opts.severity || DEFAULT_SEVERITY;
	const threshold = opts.threshold || DEFAULT_THRESHOLD;
	const samplePeriod = opts.samplePeriod || DEFAULT_SAMPLE_PERIOD;

	const regionString = process.env.REGION ? '_' + process.env.REGION : '';
	const region = process.env.REGION === 'US' ? 'us' : 'eu';

	return nHealth.runCheck({
		id: `error-rate-${region}`,
		name: `Error rate: greater than ${threshold}% of requests for ${appName} in ${region}`,
		type: 'graphiteThreshold',
		metric: `asPercent(summarize(sumSeries(next.heroku.${appName}.web_*${regionString}.express.*.res.status.{500,503,504}.count), '${samplePeriod}', 'sum', true), summarize(sumSeries(next.heroku.${appName}.web_*${regionString}.express.*.res.status.*.count), '${samplePeriod}', 'sum', true))`,
		threshold,
		samplePeriod,
		severity,
		businessImpact: 'Users may see application error pages.',
		technicalSummary: `The proportion of error responses for ${appName} is greater than ${threshold}% of all responses. This is a default n-express check.`,
		panicGuide:
			'Consult application logs in splunk and run the application locally to identify errors'
	});
};
