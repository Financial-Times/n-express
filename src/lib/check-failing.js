const isAfter = require('date-fns/is_after');
const addSeconds = require('date-fns/add_seconds');
const addMinutes = require('date-fns/add_minutes');
const isWithinRange = require('date-fns/is_within_range');
const differenceInMilliseconds = require('date-fns/difference_in_milliseconds');

const the = {
	fetchInterval: 1000,
	allFailures: [],
};

module.exports.init = function () {

	fetchAndCacheFailureToSimulate()
		.then(periodically(fetchAndCacheFailureToSimulate))
		.catch(function (error) {
			console.error('Error occurred when initialising the `check-failing` module', error);
		});
};

module.exports.fakeCheckFailuresIfApplicable = function (systemCode, checks, res) { //   TODO:  Remove res

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
};

function fetchFailureToSimulate () {
	const request = {
		url: 'http://ft-next-health-eu.herokuapp.com/failure-simulation-config'
	};

	return fetch(request.url)
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
		.then(failures => {
			the.failures = failures;
		});
}

function periodically (func) {
	return function () {
		setInterval(func, the.fetchInterval);
	};
}

// TODO: Fail silently
// TODO: Add error handler for failure fetch
// TODO: Remove unused methods
// TODO: Consistently use function instead of () => {}
