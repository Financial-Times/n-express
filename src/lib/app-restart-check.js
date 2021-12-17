/**
 * @typedef {import("../../typings/n-express").ErrorRateHealthcheckOptions} ErrorRateHealthcheckOptions
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
const nHealth = require('n-health');

const DEFAULT_SEVERITY = 2;
const DEFAULT_THRESHOLD = 20;

/**
  * @param {string} appName
  * @param {ErrorRateHealthcheckOptions?} [opts]
  * @returns {Healthcheck & TickingMetric}
  */
module.exports = (appName, opts) => {
	opts = opts || {};
	const severity = opts.severity || DEFAULT_SEVERITY;
	const threshold = opts.threshold || DEFAULT_THRESHOLD;

	return nHealth.runCheck(
		{
			id: `${appName}-restarts`,
			name: `${appName} restart rate is normal`,
			type: 'graphiteSpike',
			threshold: threshold,
			baselinePeriod: '14d',
			samplePeriod: '1hour',
			numerator: `next.heroku.${appName}.*.express.start`,
			severity: severity,
			businessImpact: 'Some part of the next platform has become severly unstable; impact can vary',
			technicalSummary: `This alert going off means that there has been a noticeable (${threshold} times) spike in app restart rate. The reason can be innocent - merging many PRs in one day, but it also may be caused by an app stuck in a crash-restart loop.`,
			panicGuide: 'Check Heroku app metrics for app starts to see if they correspond to PRs getting merged or error spikes. If it is error spikes, investigate for potential errors by checking this app\'s Splunk logs and Grafana dashboards.'
		}
	);
};
