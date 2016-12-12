'use strict';

var checkFailing = require('./check-failing');
const logger = require('@financial-times/n-logger').default;
const raven = require('@financial-times/n-raven');
const metrics = require('next-metrics');

module.exports = function (app, options, description) {
	const defaultAppName = `Next FT.com ${app.locals.__name} in ${process.env.REGION || 'unknown region'}`;

	const checks = options.healthChecks.map(function(check, i) {
		let checkPromise;
		if (typeof check.init === 'function') {
			checkPromise = Promise.resolve(check.init())
				.catch(e => {
					metrics.count(`failed_healthcheck_init.${i}.count`);
					logger.error("event=FAILED_HEALTHCHECK_INIT", e)
					raven.captureError(e);
					throw e;
				})
		} else {
			logger.error(`Healthchecks should now return an object with an init method to kick them off.
Self-initialising healthchecks will be deprecated in n-express@18
`);
			checkPromise = Promise.resolve(check);
		}
		return checkPromise;
	});

	app.get(/\/__health(?:\.([123]))?$/, function(req, res) {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });

		Promise.all(checks)
			.then(checks => {
				checks = checks.map(function(check) {
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
			})

	});

}
