/**
 * @typedef {import("../../typings/n-express").ErrorRateHealthcheckOptions} ErrorRateHealthcheckOptions
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
const nHealth = require('n-health');

const DEFAULT_SEVERITY = 2;

/**
  * @param {string} appName
  * @param {ErrorRateHealthcheckOptions?} [opts]
  * @returns {Healthcheck & TickingMetric}
  */
module.exports = (appName, opts) => {
	opts = opts || {};
	const severity = opts.severity || DEFAULT_SEVERITY;

	let region_name, dyno_matcher;

	if (process.env.REGION) {
		region_name = process.env.REGION.toUpperCase();
		dyno_matcher = `*_${region_name}`;
	} else {
		region_name = 'unknown region';
		dyno_matcher = '*';
	}

	const applicationStartMetric = `next.heroku.${appName}.${dyno_matcher}.express.start`;

	return nHealth.runCheck(
		{
			id: `${appName}-restarts`,
			name: `${appName} restart rate is normal (${region_name})`,
			type: 'graphiteThreshold',
			threshold: 2,
			samplePeriod: '6hours',
			metric: `transformNull(summarize(${applicationStartMetric}, '1h'), 0)`,
			severity: severity,
			businessImpact: `Parts of the site that depend on '${appName}' may be unstable`,
			technicalSummary: `This alert going off means that a dyno is restarting more frequently than we expect. The reason can be innocent - merging many PRs in one day, but it also may be caused by an app stuck in a crash-restart loop.`,
			panicGuide: 'Check Heroku app metrics for app starts to see if they correspond to PRs getting merged or error spikes. If it is error spikes, investigate for potential errors by checking this app\'s Splunk logs and Grafana dashboards.'
		}
	);
};
