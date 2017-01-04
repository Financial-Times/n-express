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

