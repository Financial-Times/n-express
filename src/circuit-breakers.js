'use strict';
var CircuitBreaker = require('circuit-breaker-js');

var Breaker = function() {
	this.serviceBreakers = {};
	this.defaultBreakerOptions = {
		windowDuration: 10000,
		numBuckets: 10,
		timeoutDuration: 3000,
		errorThreshold: 50,
		volumeThreshold: 10
	};
};

Breaker.prototype.instrument = function(opts) {
	this.serviceMatchers = opts.serviceMatchers;
	this.serviceNames = Object.keys(opts.serviceMatchers);

	this.serviceNames.forEach(function(service){
		this.serviceBreakers[service] = new CircuitBreaker(this.defaultBreakerOptions);

		this.serviceBreakers[service].onCircuitOpen = function() {
			opts.metrics.count('fetch_' + service + '_circuit_open', 1);
		};
		this.serviceBreakers[service].onCircuitClose = function() {
			opts.metrics.count('fetch_' + service + '_circuit_close', 1);
		};
	}.bind(this));

	var _fetch = GLOBAL.fetch;
	var that = this; // not using bind as don't want to muck around with fetch's scope

	GLOBAL.fetch.prototype = Object.create(_fetch.prototype);
	GLOBAL.fetch.constructor = function(url, opts) {
		var service;
		var args = arguments;
		// that.serviceNames.some(function(name) {
		// 	if (that.serviceMatchers[name].test(url)) {
		// 		service = name;
		// 		return true;
		// 	}
		// });

		// HACK: Temoprarily only test functionality on single service;
		service = 'ft-next-personalised-feed-api';

		if (service && that.serviceBreakers[service]) {

			return new Promise(function (resolve, reject) {
				that.serviceBreakers[service].run(function(success, fail) {
					_fetch.apply(this, args)
						.then(function(res) {
							if(!res.ok) {
								fail();
							} else {
								success();
							}
							resolve(res);
						})
						.catch(function(err) {
							fail();
							reject(err);
						});

				}.bind(this), function(){
					// Use node-ftech response object:
					// https://github.com/bitinn/node-fetch/blob/master/lib/response.js#L20
					resolve(new _fetch.Response({
						message: '503 Service Unavailable: Circuit breaker tripped.'
					}, {
						status: 503,
						timeout: 3000
					}));
				});
			}.bind(this));

		} else {
			return _fetch.apply(this, arguments);
		}
	};

};

module.exports = new Breaker();
