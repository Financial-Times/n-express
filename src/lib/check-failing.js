const fs = require('fs');
const isWithinRange = require('date-fns/is_within_range');
const logger = require('@financial-times/n-logger').default;

const the = {
	currentDate: new Date(),
	fetchInterval: 60000 * 5,
	failures: []
};

const getTimezone = () => {
	if (process.env.TZ) {
		return process.env.TZ;
	}

	if (fs.existsSync('/etc/timezone')) {
		let timezone = fs.readFileSync('/etc/timezone');

		if (timezone) {
			return timezone;
		}
	}

	if (fs.lstatSync('/etc/localtime').isSymbolicLink()) {
		let timezone = fs.readlinkSync('/etc/localtime').replace('/usr/share/zoneinfo/', '');

		if (timezone) {
			return timezone;
		}
	}

	logger.error({ event: 'EXPRESS_GET_TIMEZONE_FAIL' });

	// Fallback to a number representation of the timezone.
	return new Date().getTimezone();
};

module.exports.init = function () {
	fetchAndCacheFailureToSimulate()
		.then(periodically(fetchAndCacheFailureToSimulate))
		.catch(function (error) {
			console.error('Error occurred when initialising the `check-failing` module', error); //eslint-disable-line
		});
};

module.exports.fakeCheckFailuresIfApplicable = function (systemCode, checks, req, res) {
	if (req.query.dump === '1') {
		res.send({
			systemCode,
			server: {
				timezone: getTimezone(),
			},
			state: the,
			checks
		});
	}

	try {

		if (systemCode) {

			let alreadyProcessedSeverities = {};

			checks.forEach(function (check) {

				if (!alreadyProcessedSeverities[check.severity]) {

					the.failures.forEach(function (failure) {

						if (failure.systemCode === systemCode && failure.severity === check.severity) {

							const checkShouldBeMarkedAsFailing = isWithinRange(new Date(), failure.startTime, failure.endTime);

							if (checkShouldBeMarkedAsFailing) {
								check.ok = false;
							}

							alreadyProcessedSeverities[check.severity] = check.severity;
						}
					});
				}
			});
		}

	}
	catch (error) {
		error.message = 'Problem with the `fakeCheckFailuresIfApplicable()` ' +
			'method of the chec-failing module --> ' + error.message;
		console.error(error); //eslint-disable-line
	}
};

function fetchFailureToSimulate () {
	const request = {
		url: 'http://ft-next-health-eu.herokuapp.com/failure-simulation-config'
	};

	return fetch(request.url, {
		timeout: 1000
	})
		.then(function (response) {
			if (response.status !== 200) {
				return Promise.reject(new Error('status: ' + response.status));
			}
			return response.json();
		})
		.then(function (config) {
			return config.failures;
		})
		.catch(function (error) {
			error.message = 'Failed to fetch health check failures simulation config ---> ' + error;
			return Promise.reject(error);
		});
}

function fetchAndCacheFailureToSimulate () {
	return fetchFailureToSimulate()
		.then(function (failures) {
			the.failures = failures;
		});
}

function periodically (func) {
	return function () {
		setInterval(func, the.fetchInterval);
	};
}
