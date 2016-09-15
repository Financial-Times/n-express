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

			if(!alreadyProcessedSeverities[check.severity]) {

				the.failures.forEach(function (failure) {

					if(failure.systemCode === systemCode && failure.severity === check.severity) {

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

const items = [ // TODO: Remove
	{
		systemCode: 'next-front-page',
		startTime: addSeconds(new Date(), 10),
		endTime: addSeconds(new Date(), 15),
		severity: 2
	},
	{
		systemCode: 'next-router',
		startTime: addSeconds(new Date(), 5),
		endTime: addSeconds(new Date(), 6),
		severity: 2
	},
	{
		systemCode: 'next-front-page',
		startTime: addSeconds(new Date(), 20),
		endTime: addSeconds(new Date(), 25),
		severity: 1
	}
];

function fetchFailureToSimulate () {
    // TODO: Implement
	return Promise.resolve(items);
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
