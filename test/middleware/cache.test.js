/*global it, describe, beforeEach, before, after*/
"use strict";

var request = require('supertest');
var app = require('../fixtures/app/main');
var metrics = require('next-metrics');
var sinon = require('sinon');
var nextExpress = require('../../main');
var expect = require('chai').expect;
var raven = require('@financial-times/n-raven');
var flags = require('next-feature-flags-client');
var handlebars = require('@financial-times/n-handlebars');

const log = console.log.bind(console);

describe('cache middleware', function () {

	it('set no cache', function (done) {
		request(app)
			.get('/cache?length=no')
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'no-cache, no-store, must-revalidate, private')
			.expect(200, done);
	});

	it('set short cache', function (done) {
		request(app)
			.get('/cache?length=short')
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('set hour cache', function (done) {
		request(app)
			.get('/cache?length=hour')
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('set day cache', function (done) {
		request(app)
			.get('/cache?length=day')
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('set long cache', function (done) {
		request(app)
			.get('/cache?length=long')
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200, private')
			.expect(200, done);
	});

	it('allow overriding of cache lengths', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {
				'max-age': 1,
				'stale-while-revalidate': 2,
				'stale-if-error': 3
			}]))
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=1, stale-while-revalidate=2, stale-if-error=3, private')
			.expect(200, done);
	});

	it('allow overriding to public', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {public: true}]))
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate, public')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, public')
			.expect(200, done);
	});

	it('allow overriding of arbitrary cache properties', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {conditions: 'never-ever-ever-ever=felt-so-bad'}]))
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, never-ever-ever-ever=felt-so-bad, private')
			.expect(200, done);
	});

	it('never override Cache-Control to private if trtying to set private cache', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {private: true}]))
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('allow setting custom surrogate control header', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['max-age=5']))
			.expect('Cache-Control', 'no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=5')
			.expect(200, done);
	});

	it('allow setting custom surrogate and cache control header', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['max-age=5', 'max-age=10']))
			.expect('Cache-Control', 'max-age=10')
			.expect('Surrogate-Control', 'max-age=5')
			.expect(200, done);
	});

	it('throw if setting private cache control when using custom headers', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['max-age=5', 'max-age=10, private']))
			.expect(500, done)
	});
});
