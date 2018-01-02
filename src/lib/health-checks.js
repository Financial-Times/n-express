const errorRateCheck = require('./error-rate-check');
const unRegisteredServicesHealthCheck = require('./unregistered-services-healthCheck');

module.exports = (app, options, meta) => {
	const defaultAppName = `Next FT.com ${meta.name} in ${process.env.REGION || 'unknown region'}`;

	const defaultChecks = [
		errorRateCheck(meta.name, options.errorRateHealthcheck),
		unRegisteredServicesHealthCheck.setAppName(meta.name)
	];

	const healthChecks = options.healthChecks.concat(defaultChecks);

	app.get(/\/__health(?:\.([123]))?$/, (req, res) => {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
		const checks = healthChecks.map(check => check.getStatus());
		if (checks.length === defaultChecks.length) {
			checks.push({
				name: 'App has no additional healthchecks',
				ok: false,
				severity: 3,
				businessImpact: 'If this application encounters any problems, nobody will be alerted and it probably will not get fixed.',
				technicalSummary: 'This app has no additional healthchecks set up',
				panicGuide: 'Don\'t Panic',
				lastUpdated: new Date()
			});
		}
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
