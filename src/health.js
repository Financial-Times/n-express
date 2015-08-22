"use strict";


module.exports = function(healthChecks, appName, description, circuitBreakers) {
	return function(req, res) {
		res.set({ 'Cache-Control': 'no-store' });
		var checks = healthChecks.map(function(check) {
			return check.getStatus();
		});
		if (checks.length === 0) {
			checks.push({
				name: 'App has no custom healthchecks',
				ok: false,
				severity: 3,
				businessImpact: 'If this application encounters any problems, nobody will be alerted and it probably will not get fixed.',
				technicalSummary: 'This app has no healthchecks set up',
				panicGuide: 'Don\'t Panic'
			});
		}
		if (circuitBreakers) {
			var trippedSwitches = Object.keys(circuitBreakers)
				.filter(function(breaker) {
					return circuitBreakers[breaker].isOpen();
				});

			checks.push({
				name: 'HTTP circuit breakers allowing requests to flow through',
				ok: trippedSwitches.length > 0 ? false : true,
				severity: 2,
				businessImpact: 'This application may now be running a reduced state',
				technicalSummary: "We\'re getting too many errors from an upstream dependency so we\'ve temporarily stopped making requests to it.\n\nAffected routes: " + trippedSwitches.join(', '),
				panicGuide: 'Don\'t Panic'
			});
		}
		if (req.params[0]) {
			checks.forEach(function(check) {
				if (check.severity <= Number(req.params[0]) && check.ok === false) {
					res.status(500);
				}
			});
		}
		res.json({
			schemaVersion: 1,
			name: appName,
			description: description,
			checks: checks
		});
	};
};
