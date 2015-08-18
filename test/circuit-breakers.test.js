'use strict';

/*global it, describe, before, afterEach, beforeEach*/
require('es6-promise').polyfill();
var expect = require('chai').expect;
var metrics = require('next-metrics');
var sinon = require('sinon');
var app = require('./fixtures/app/main');

describe('circuit breakers', function(){

	describe('services', function() {
		it('should instrument fetch with a circuit breaker for each service', function() {
			expect(app.circuitBreakers).to.exist;
		});
	});

	describe('failures', function() {

		var breaker;

		before(function() {
			breaker = app.circuitBreakers['ft-next-personalised-feed-api'];
			breaker.windowDuration = 1000;
			breaker.numBuckets = 1;
			breaker.volumeThreshold = 1;
		});

		beforeEach(function() {
			return fetch('http://localhost:3000/__fail');
		});

		afterEach(function() {
			breaker._buckets = [breaker._createBucket()];
			breaker._state = 2;
		});

		it('should trip circuit if service fails', function() {
				return fetch('http://localhost:3000/__fail').then(function(res) {
				expect(breaker.isOpen()).to.be.true;
			});
		});

		it('should fail /__health.2 if circuit is tripped', function() {
			return fetch('http://localhost:3000/__fail')
				.then(function() {
					return fetch('http://localhost:3000/__health.2');
				})
				.then(function(res) {
					expect(res.status).to.be.equal(500);
				});
		});

		it('should fail fast when circuit is tripped', function() {
			return fetch('http://localhost:3000/__fail')
				.then(function() {
					expect(breaker.isOpen()).to.be.true;
					return fetch('http://localhost:3000/__fail');
				})
				.then(function(res) {
					expect(res.body.message).to.contain('Circuit breaker tripped.');
				});
		});

		it('should count every time the circuit trips', function() {
			sinon.stub(metrics, 'count');
			return fetch('http://localhost:3000/__fail')
				.then(function() {
					expect(metrics.count.calledWith('fetch.ft-next-personalised-feed-api.circuit.open')).to.be.true;
					metrics.count.restore();
				});
		});
	});

});
