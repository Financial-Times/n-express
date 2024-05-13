/*global it, describe*/
const request = require('supertest');
const defaultApp = require('./../fixtures/app/main');

describe('health', function () {
	context('default app', () => {
		it('should not 500 /__health.1', function (done) {
			request(defaultApp).get('/__health.1').expect(200, done);
		});

		it('should not 500 /__health.2', function (done) {
			request(defaultApp).get('/__health.2').expect(200, done);
		});

		it('should not 500 /__health.3', function (done) {
			request(defaultApp).get('/__health.3').expect(200, done);
		});
	});

	after(() => {
		defaultApp.close();
	});
});
