'use strict';

var checkFailing = require('./check-failing');

module.exports = function (app, options, description) {
	const healthChecks = options.healthChecks;
	const defaultAppName = `Next FT.com ${app.locals.__name} in ${process.env.REGION || 'unknown region'}`;

	app.get(/\/__health(?:\.([123]))?$/, function(req, res) {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
		const checks = healthChecks.map(function(check) {
			return check.getStatus();
		});
		if (checks.length === 0) {
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
			checks.forEach(function(check) {
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
			description: description,
			checks: checks
		}, undefined, 2));
	});

}
