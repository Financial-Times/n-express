'use strict';

/*global it, describe, beforeEach */
require('es6-promise').polyfill();
var nextExpress = require('../main');
var expect = require('chai').expect;
var metrics = require('next-metrics');
var sinon = require('sinon');
var PORT = 3000;

describe('circuit breakers', function(){

	describe('services', function() {
		it('should instrument fetch with a circuit breaker for each service', function() {
			var realFetch = GLOBAL.fetch;
			var app = nextExpress();
			expect(GLOBAL.fetch).to.not.equal(realFetch);
			expect(app.circuitBreakers).to.exist;
		});
	});

	describe('failures', function() {

		var app;
		var breaker;

		beforeEach(function() {
			app = nextExpress({
				serviceDependencies: {
					'ft-next-personalised-feed-api': /\/__fail/
				}
			});

			app.get('/__fail', function (req, res) {
				res.sendStatus(503);
			});

			breaker = app.circuitBreakers['ft-next-personalised-feed-api'];
			breaker.windowDuration = 1000;
			breaker.numBuckets = 1;
			breaker.volumeThreshold = 1;

			return app.listen(++PORT);
		});

		it('should trip circuit if service fails', function() {
			return fetch('http://localhost:' + PORT + '/__fail')
				.then(function() {
					expect(breaker.isOpen()).to.be.true;
				});
		});

		it('should fail /__health.2 if circuit is tripped', function() {
			return fetch('http://localhost:' + PORT + '/__fail')
				.then(function() {
					expect(breaker.isOpen()).to.be.true;
					return fetch('http://localhost:' + PORT + '/__health.2');
				})
				.then(function(res) {
					expect(res.status).to.be.equal(500);
				});
		});

		it('should fail fast when circuit is tripped', function() {
			return fetch('http://localhost:' + PORT + '/__fail')
				.then(function() {
					return fetch('http://localhost:5000/__fail');
				})
				.then(function(res) {
					expect(res.body.message).to.contain('Circuit breaker tripped.');
				});
		});

		it('should count every time the circuit trips', function() {
			sinon.stub(metrics, 'count');
			return fetch('http://localhost:' + PORT + '/__fail')
				.then(function() {
					expect(metrics.count.calledWith('fetch.ft-next-personalised-feed-api.circuit.open')).to.be.true;
					metrics.count.restore();
				});
		});
	});

});
