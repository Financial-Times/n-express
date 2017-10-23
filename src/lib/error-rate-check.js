const nHealth = require('n-health');

const DEFAULT_SEVERITY = 3;

module.exports = (appName, opts) => {
	opts = opts || {};
	const severity = opts.severity || DEFAULT_SEVERITY;
	let region = process.env.REGION ? '_' + process.env.REGION : '';
	return nHealth.runCheck({
		name: `The error rate for ${appName} is greater than 4% of requests`,
		type: 'graphiteThreshold',
		metric: `asPercent(summarize(sumSeries(next.heroku.${appName}.web_*${region}.express.*.res.status.{500,503,504}.count), '10min', 'sum', true), summarize(sumSeries(next.heroku.${appName}.web_*${region}.express.*.res.status.*.count), '10min', 'sum', true))`,
		threshold: 4,
		samplePeriod: '10min',
		severity,
		businessImpact: 'Users may see application error pages.',
		technicalSummary: `The proportion of error responses for ${appName} is greater than 4% of all responses. This is a default n-express check.`,
		panicGuide: 'Consult errors in sentry, application logs in splunk and run the application locally to identify errors'
	});
};
