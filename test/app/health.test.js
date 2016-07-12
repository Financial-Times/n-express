/*global it, describe*/
'use strict';

const request = require('supertest');
const app = require('./../fixtures/app/main');

describe('health', function() {

	it('by default it should not 500 /__health.1', function(done) {
		request(app)
			.get('/__health.1')
			.expect(200, done);
	});

	it('by default it should not 500 /__health.2', function(done) {
		request(app)
			.get('/__health.2')
			.expect(200, done);
	});

	it('by default it should 500 /__health.3', function(done) {
		request(app)
			.get('/__health.3')
			.expect(500, done);
	});

});
