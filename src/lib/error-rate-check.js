const nHealth = require('n-health');

const DEFAULT_THRESHOLD = 0.04;
const DEFAULT_SEVERITY = 3; // TODO: see how flaky this is and consider raising to severity 1 (Theo)

module.exports = (appName, opts) => {
	opts = opts || {};
	const threshold = opts.threshold || DEFAULT_THRESHOLD;
	const severity = opts.severity || DEFAULT_SEVERITY;
	return nHealth.runCheck({
		type: 'graphiteThreshold',
		metric: `
			divideSeries(
				sumSeries(
					next.heroku.${appName}.web_*${ process.env.REGION ? '_' + process.env.REGION : '' }.express.*_GET.res.status.500.count
				),
				sumSeries(
					next.heroku.${appName}.web_*${ process.env.REGION ? '_' + process.env.REGION : '' }.express.*_GET.res.status.*.count
				)
			)
		`.replace(/\t|\n/g, ''),
		threshold,
		name: `500 rate for ${appName} is acceptable`,
		severity,
		businessImpact: `Error rate for the ${appName} app is higher than the acceptable threshold of ${threshold*100}%.`,
		technicalSummary: `The proportion of 500 responses for the ${appName} application requests across all heroku dynos vs all responses is higher than a threshold of ${threshold*100}%`,
		panicGuide: 'Consult errors in sentry, application logs in splunk and run the application locally to identify errors'
	});
};
