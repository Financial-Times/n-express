/*global it, describe*/
"use strict";

var request = require('supertest');
var app = require('./fixtures/app/main');

var nextExpress = require('../main');

describe('health', function () {

	it('by default it should not 500 /__health.1', function (done) {
		request(app)
			.get('/__health.1')
			.expect(200, done);
	});

	it('by default it should not 500 /__health.2', function (done) {
		request(app)
			.get('/__health.2')
			.expect(200, done);
	});

	it('by default it should 500 /__health.3', function (done) {
		request(app)
			.get('/__health.3')
			.expect(500, done);
	});

	it('but if there are passing health checks it should 200 /__health.3', function (done) {

		var app = nextExpress({
			healthChecks: [
				{
					getStatus: function () {
						return {
							ok: true
						}
					}
				}
			]
		});

		request(app)
			.get('/__health.3')
			.expect(200, done);
	});

	it('should handle health checks returned as promises', function (done) {

		var app = nextExpress({
			healthChecks: [
				{
					getStatus: function () {
						return Promise.resolve({
							ok: true
						})
					}
				}
			]
		});

		request(app)
			.get('/__health')
			.expect(200, done);
	});

	it('should 500 if a health check returns a failing promise (this is always wrong)', function (done) {

		var app = nextExpress({
			healthChecks: [
				{
					getStatus: function () {
						return Promise.reject();
					}
				}
			]
		});

		request(app)
			.get('/__health')
			.expect(500, done);
	});


});
