'use strict';

/*global it, describe, beforeEach */
require('es6-promise').polyfill();
var nextExpress = require('../main');
var expect = require('chai').expect;
var metrics = require('next-metrics');
var sinon = require('sinon');

describe('circuit breakers', function(){

	describe('services', function() {
		it('should instrument fetch with a circuit breaker for each service', function(done){
			var realFetch = GLOBAL.fetch;
			var app = nextExpress();
			expect(GLOBAL.fetch).to.not.equal(realFetch);
			expect(app.circuitBreakers).to.exist;
			done();
		});
	});

	describe('failures', function() {

		var app;
		var breaker;

		beforeEach(function(){
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

		});

		it('should trip circuit if service fails', function(done){
			fetch('http://localhost:3000/__fail')
				.then(function() {
					expect(breaker.isOpen()).to.be.true;
					done();
				});
		});

		it('should fail fast when circuit is tripped', function(done){
			fetch('http://localhost:3000/__fail')
				.then(function() {
					return fetch('http://localhost:5000/__fail');
				})
				.then(function(res) {
					expect(res.body.message).to.contain('Circuit breaker tripped.');
					done();
				});
		});

		it('should count every time the circuit trips', function (done) {
			sinon.stub(metrics, 'count');
			fetch('http://localhost:3000/__fail')
				.then(function() {
					expect(metrics.count.calledWith('fetch.ft-next-personalised-feed-api.circuit.open')).to.be.true;
					metrics.count.restore();
					done();
				});
		});
	});

});
