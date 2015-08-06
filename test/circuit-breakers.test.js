'use strict';

/*global it, describe, beforeEach*/
require('es6-promise').polyfill();
var nextExpress = require('../main');
var expect = require('chai').expect;

describe('circuit breakers', function(){

	describe('services', function() {
		it('should instrument  with a circuit breaker for each service', function(done){
			var realFetch = GLOBAL.fetch;
			var app = nextExpress();
			expect(GLOBAL.fetch).to.not.equal(realFetch);
			expect(app.circuitBreakers).to.exist;
			done();
		});
	});

	describe('failures', function() {

		it('should trip circuit if service fails', function(done){
			var app = nextExpress({
				serviceDependencies: {
					'ft-next-personalised-feed-api': /\/__fail/
				}
			});

			app.get('/__fail', function (req, res) {
				res.sendStatus(503);
			});

			var breaker = app.circuitBreakers['ft-next-personalised-feed-api'];
			breaker.windowDuration = 1000;
			breaker.numBuckets = 1;
			breaker.volumeThreshold = 1;

			app.listen(5000).then(function(){
				fetch('http://localhost:5000/__fail')
					.then(function() {
						expect(breaker.isOpen()).to.be.true;
						return fetch('http://localhost:5000/__fail');
					})
					.then(function(res) {
						expect(res.body.message).to.contain('Circuit breaker tripped.');
						done();
					});
			});
		});

	});

});
