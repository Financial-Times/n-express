const raven = require('@financial-times/n-raven');
const metrics = require('next-metrics');
const debounce = require('debounce');
let unregisteredServices = {};

function getMessage () {
	const message = Object.keys(unregisteredServices).join(', ') + ' services called but no metrics set up. See next-metrics/lib/metrics/services.js';
	unregisteredServices = {};
	return message;
};

const alerter = debounce(function () {
	raven.captureMessage(getMessage());
}, 5 * 60 * 1000, true);

module.exports = {
	init: () => metrics.fetch.instrument({
		onUninstrumented: function (url) {
			if (typeof url === 'string') {
				unregisteredServices[url.split('?')[0]] = true;
			}
			alerter();
		}
	})
};
