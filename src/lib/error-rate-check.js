const nHealth = require('n-health');

module.exports = (appName) => (
	nHealth.runCheck({
		type: 'graphiteThreshold',
		metric: `
			divideSeries(
				sumSeries(
					next.heroku.${appName}.web_*${ process.env.REGION ? '_' + process.env.REGION : '' }.express.default_route_GET.res.status.500.count
				),
				sumSeries(
					next.heroku.${appName}.web_*${ process.env.REGION ? '_' + process.env.REGION : '' }.express.default_route_GET.res.status.*.count
				)
			)
		`.replace(/\t|\n/g, ''),
		threshold: 0.02,
		name: `500 rate for ${appName} is acceptable`,
		severity: 2,
		businessImpact: `Error rate for the ${appName} app is higher than the acceptable threshold of 2%.`,
		technicalSummary: `The proportion of 500 responses for the ${appName} application requests across all heroku dynos vs all responses is higher than a threshold of 0.02`,
		panicGuide: 'Consult application logs in splunk and run the application locally to identify errors'
	})
);
