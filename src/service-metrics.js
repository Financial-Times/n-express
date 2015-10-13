'use strict';
var errorsHandler = require('express-errors-handler');
var metrics = require('next-metrics');
var debounce = require('debounce');
var unregisteredServices = {};

var getMessage = function () {
	var message = Object.keys(unregisteredServices).join(', ') + ' services called but no metrics set up. See next-metrics/lib/metrics/services.js';
	unregisteredServices = {};
	return message;
};

var alerter = debounce(function () {
	errorsHandler.captureMessage(getMessage());
}, 5 * 60 * 1000, true);

/**

	Looking for the services list?

	It's moved to next-metrics
	https://github.com/Financial-Times/next-metrics/blob/master/lib/metrics/services.js

**/

module.exports = {
	init: function () {

		metrics.fetch.instrument({
			onUninstrumented: function(url) {
				unregisteredServices[url.split('?')[0]] = true;
				alerter();
			}
		});
	}
};
