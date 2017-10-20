const nHealth = require('n-health');

const DEFAULT_SEVERITY = 3;

module.exports = (appName, opts) => {
	opts = opts || {};
	const severity = opts.severity || DEFAULT_SEVERITY;
	let region = process.env.REGION ? '_' + process.env.REGION : '';
	return nHealth.runCheck({
		name: `The error rate for ${appName} is acceptable`,
		type: 'graphiteSpike',
		numerator: `next.heroku.${appName}.web_*${region}.express.*.res.status.{500,503,504}.count`,
		divisor: `next.heroku.${appName}.web_*${region}.express.*.res.status.*.count`,
		severity,
		businessImpact: 'Users may see application error pages.',
		technicalSummary: `The proportion of 500 responses for the ${appName} app is 3 times higher in the last 10 minutes than the error rate over the previous 7 days. This is a default n-express check.`,
		panicGuide: 'Consult errors in sentry, application logs in splunk and run the application locally to identify errors'
	});
};
