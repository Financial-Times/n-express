/*global it, describe, beforeEach, before, after*/
"use strict";

var request = require('supertest');
var app = require('./fixtures/app/main');
var metrics = require('next-metrics');
var sinon = require('sinon');
var nextExpress = require('../main');
var expect = require('chai').expect;
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var handlebars = require('ft-next-handlebars');

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
