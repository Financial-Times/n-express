/*global it, describe*/
const request = require('supertest');
const defaultApp = require('./../fixtures/app/main');
const errorRateCheckDisabledApp = require('./../fixtures/app/error-rate-check-disabled');

describe('health', function () {
	context('default app', () => {
		it('should not 500 /__health.1', function (done) {
			request(defaultApp).get('/__health.1').expect(200, done);
		});

		it('should not 500 /__health.2', function (done) {
			request(defaultApp).get('/__health.2').expect(200, done);
		});

		it('should 500 /__health.3', function (done) {
			request(defaultApp).get('/__health.3').expect(500, done);
		});
	});

	context('with error rate disabled', () => {
		it('should not 500 /__health.1', function (done) {
			request(errorRateCheckDisabledApp).get('/__health.1').expect(200, done);
		});

		it('should not 500 /__health.2', function (done) {
			request(errorRateCheckDisabledApp).get('/__health.2').expect(200, done);
		});

		it('should 500 /__health.3', function (done) {
			request(errorRateCheckDisabledApp).get('/__health.3').expect(500, done);
		});
	});

	after(() => {
		errorRateCheckDisabledApp.close();
		defaultApp.close();
	});
});
