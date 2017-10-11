const nHealth = require('n-health');

const DEFAULT_THRESHOLD = 0.04;
const DEFAULT_SEVERITY = 3;

module.exports = (appName, opts) => {
	opts = opts || {};
	const threshold = opts.threshold || DEFAULT_THRESHOLD;
	const severity = opts.severity || DEFAULT_SEVERITY;
	let region = process.env.REGION ? '_' + process.env.REGION : '';
	return nHealth.runCheck({
		name: `500 rate for ${appName} is acceptable (default n-express health check)`,
		type: 'graphiteSpike',
		numerator: `next.heroku.${appName}.web_*${region}.express.*_GET.res.status.500.count`,
		divisor: `next.heroku.${appName}.web_*${region}.express.*_GET.res.status.*.count`,
		threshold,
		severity,
		businessImpact: `Error rate for the ${appName} app is higher than the acceptable threshold of ${threshold*100}%.`,
		technicalSummary: `The proportion of 500 responses for the ${appName} application requests across all heroku dynos vs all responses is higher than a threshold of ${threshold*100}%`,
		panicGuide: 'Consult errors in sentry, application logs in splunk and run the application locally to identify errors'
	});
};
