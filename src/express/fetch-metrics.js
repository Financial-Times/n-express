'use strict';

var metrics = require('next-metrics');
var serviceMatchers = {
	'capi1-get': /^http:\/\/blahblah/
};

var counters = {};

var serviceNames = Object.keys(serviceMatchers);

serviceNames.forEach(function (service) {
	counters['fetch_' + service + '_requests'] = new metrics.Counter();
	counters['fetch_' + service + '_status_2xx'] = new metrics.Counter();
	counters['fetch_' + service + '_status_2xx_response_time'] = new metrics.Histogram.createUniformHistogram();
	counters['fetch_' + service + '_status_3xx'] = new metrics.Counter();
	counters['fetch_' + service + '_status_3xx_response_time'] = new metrics.Histogram.createUniformHistogram();
	counters['fetch_' + service + '_status_4xx'] = new metrics.Counter();
	counters['fetch_' + service + '_status_5xx'] = new metrics.Counter();
});

function fetchReporter() {

	var obj = {};

	serviceNames.forEach(function (service) {
		obj['fetch.' + service + '.count'] = counters['fetch_' + service + '_requests'].count;
		counters['fetch_' + service + '_requests'].clear();

		obj['fetch.' + service + '.response.status_2xx.response_time.mean'] = counters['fetch_' + service + '_status_2xx_response_time'].mean();
		obj['fetch.' + service + '.response.status_2xx.response_time.min'] = counters['fetch_' + service + '_status_2xx_response_time'].min;
		obj['fetch.' + service + '.response.status_2xx.response_time.max'] = counters['fetch_' + service + '_status_2xx_response_time'].max;
		counters['fetch_' + service + '_status_2xx_response_time'].clear();

		obj['fetch.' + service + '.response.status_2xx.count'] = counters['fetch_' + service + '_status_2xx'].count;
		counters['fetch_' + service + '_status_2xx'].clear();

		obj['fetch.' + service + '.response.status_3xx.count'] = counters['fetch_' + service + '_status_3xx'].count;
		counters['fetch_' + service + '_status_3xx'].clear();

		obj['fetch.' + service + '.response.status_4xx.count'] = counters['fetch_' + service + '_status_4xx'].count;
		counters['fetch_' + service + '_status_4xx'].clear();

		obj['fetch.' + service + '.response.status_5xx.count'] = counters['fetch_' + service + '_status_5xx'].count;
		counters['fetch_' + service + '_status_5xx'].clear();

	});

	return obj;
}

module.exports = {
	init: function () {

		// registerCollector as yet undefined, but expects a function returning an object of key - number pairs
		metrics.registerCollector(fetchReporter);

		var _fetch = GLOBAL.fetch;

		GLOBAL.fetch = function (url, opts) {
			var service;
			serviceNames.some(function (name) {
				if (serviceMatchers[name].test(url)) {
					service = name;
					return true;
				}
			});
			if (service) {
				var start = new Date();

				return _fetch(url, opts)
								.then(function (res) {
									// do timing etc
									return res
								})
								.catch(function (err) {
									// do something maybe
									throw err
								})

			} else {
				// send error to sentry 'You're using a new service -
				// make sure you add metrics for it in next-express/sr/express/fetch-metrics.js'
				return _fetch(url, opts);
			}
		}
	}
};