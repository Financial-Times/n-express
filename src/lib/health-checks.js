const errorRateCheck = require('./error-rate-check');
const awsKeysHealthCheck = require('./aws-keys-healthcheck');
const unRegisteredServicesHealthCheck = require('./unregistered-services-healthCheck');
const metricsHealthCheck = require('./metrics-healthcheck');

module.exports = (app, options, meta) => {
	const defaultAppName = `Next FT.com ${meta.name} in ${process.env.REGION || 'unknown region'}`;
	awsKeysHealthCheck.init();

	const defaultChecks = [
		errorRateCheck(meta.name, options.errorRateHealthcheck),
		unRegisteredServicesHealthCheck.setAppName(meta.name),
		...awsKeysHealthCheck.checks,
		metricsHealthCheck(meta.name),
	];

	const healthChecks = options.healthChecks.concat(defaultChecks);

	app.get(/\/__health(?:\.([123]))?$/, (req, res) => {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
		const checks = healthChecks.map(check => check.getStatus());

		if (req.params[0]) {
			checks.forEach(check => {
				if (check.severity <= Number(req.params[0]) && check.ok === false) {
					res.status(500);
				}
			});
		}

		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify({
			schemaVersion: 1,
			name: options.healthChecksAppName || defaultAppName,
			systemCode: options.systemCode,
			description: meta.description,
			checks: checks
		}, undefined, 2));
	});

};
