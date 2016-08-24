/*global it, describe, beforeEach, before, after*/
'use strict';

const request = require('supertest');
const app = require('../fixtures/app/main');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('cache constants', function () {

	it('define cache preset constants on the response object', function (done) {
		request(app)
			.get('/cache-constants')
			.expect('FT_NO_CACHE', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('FT_SHORT_CACHE', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400')
			.expect('FT_HOUR_CACHE', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400')
			.expect('FT_DAY_CACHE', 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400')
			.expect('FT_WEEK_CACHE','max-age=604800, stale-while-revalidate=60, stale-if-error=259200')
			.expect('FT_LONG_CACHE', 'max-age=86400, stale-while-revalidate=60, stale-if-error=259200')
			.expect(200, done);
	});
});


describe('cache helper', function () {

	if (process.env.CIRCLE_TAG && Number(process.env.CIRCLE_TAG.split('.')[0].substr(1)) > 17) {
		describe('deprecation', () => {
			it('deprecate res.cache() in version 18', () => {
				const res = {};
				require('../../src/middleware/cache')({}, res, () => null)
				expect(res.cache).to.not.exist
			})
		})
	}

	it('set no cache', function (done) {
		request(app)
			.get('/cache?length=no')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=0, no-cache, no-store, must-revalidate, private')
			.expect(200, done);
	});

	it('set short cache', function (done) {
		request(app)
			.get('/cache?length=short')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=600, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('set hour cache', function (done) {
		request(app)
			.get('/cache?length=hour')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('set day cache', function (done) {
		request(app)
			.get('/cache?length=day')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=86400, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('set long cache', function (done) {
		request(app)
			.get('/cache?length=long')
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
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
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=1, stale-while-revalidate=2, stale-if-error=3, private')
			.expect(200, done);
	});

	it('allow overriding to public', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {public: true}]))
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate, public')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, public')
			.expect(200, done);
	});

	it('allow overriding of arbitrary cache properties', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {conditions: 'never-ever-ever-ever=felt-so-bad'}]))
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, never-ever-ever-ever=felt-so-bad, private')
			.expect(200, done);
	});

	it('never override Cache-Control to private if trtying to set private cache', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['hour', {private: true}]))
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
			.expect('Surrogate-Control', 'max-age=3600, stale-while-revalidate=60, stale-if-error=86400, private')
			.expect(200, done);
	});

	it('allow setting custom surrogate control header', function (done) {
		request(app)
			.post('/cache')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(['max-age=5']))
			.expect('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate')
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

const express = require('../../main');
const cache = require('../../src/middleware/cache');

describe('cache middleware provision', function () {
	it('should export cache middleware', function () {
		const res = {cache: sinon.stub()};
		const req = {};
		const next = sinon.stub();

		expect(express.cacheMiddleware).to.equal(cache.middleware);

		cache.middleware('long', 'anoverride')(req, res, next);

		expect(res.cache.calledWith('long', 'anoverride')).to.be.true;
		expect(next.calledOnce).to.be.true;
	});
})
