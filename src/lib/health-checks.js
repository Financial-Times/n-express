const checkFailing = require('./check-failing');
const errorRateCheck = require('./error-rate-check');

module.exports = (app, options, meta) => {
	const defaultAppName = `Next FT.com ${meta.name} in ${process.env.REGION || 'unknown region'}`;

	const defaultChecks = [];
	if (!options.skipDefaultErrorRateCheck) {
		defaultChecks.push(errorRateCheck(meta.name));
	}

	const healthChecks = options.healthChecks.concat(defaultChecks);

	app.get(/\/__health(?:\.([123]))?$/, (req, res) => {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
		const checks = healthChecks.map(check => check.getStatus());
		if (checks.length === 0 || checks.length === defaultChecks.length) {
			checks.push({
				name: 'App has no healthchecks',
				ok: false,
				severity: 3,
				businessImpact: 'If this application encounters any problems, nobody will be alerted and it probably will not get fixed.',
				technicalSummary: 'This app has no healthchecks set up',
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

		checkFailing.fakeCheckFailuresIfApplicable(options.systemCode, checks, req, res);

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
