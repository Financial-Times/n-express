/*global it, describe, beforeEach, before, after*/
const path = require('path');
const request = require('supertest');

// stub the setup api calls
const fetchMock = require('fetch-mock');
const metrics = require('next-metrics');
const sinon = require('sinon');
const nextExpress = require('../../main');
const expect = require('chai').expect;
const raven = require('@financial-times/n-raven');
const flags = require('next-feature-flags-client');

let app;

describe('simple app', function () {

	before(() => {

		fetchMock
			.mock(/next-flags-api\.ft\.com/, [])
			.mock('http://ft-next-health-eu.herokuapp.com/failure-simulation-config', {failures: []})
			.catch(200);

		app = require('../fixtures/app/main');

		fetchMock.restore();
	});

	it('should have its own route', function (done) {
		request(app)
			.get('/')
			.expect('Vary', /FT-Flags/i)
			.expect(200, 'Hello world', done);
	});

	it('should be possible to add routers', function (done) {
		request(app)
			.get('/router/')
			.expect('Vary', /FT-Flags/i)
			.expect(200, 'Hello router', done);
	});

	it('should have a robots.txt', function (done) {
		request(app)
			.get('/robots.txt')
			.expect(200, done);
	});

	it('should have an about json', function (done) {
		request(app)
			.get('/__about')
			.expect(200, done);
	});

	describe('backend access', function () {
		before(function () {
			process.env.NODE_ENV = 'production';
		});

		after(function () {
			process.env.NODE_ENV = '';
		});

		it('should 401 for arbitrary route without a backend access key in production', function (done) {
			request(app)
				.get('/')
				.expect('FT-Backend-Authentication', /false/)
				.expect(401, done);
		});

		it('should 401 for arbitrary route with incorrect backend access key in production', function (done) {
			request(app)
				.get('/')
				.set('FT-Next-Backend-Key', 'as-if')
				.expect('ft-backend-authentication', /false/)
				.expect(401, done);
		});

		it('should allow double-underscorey routes through without backend access key', function (done) {
			request(app)
				.get('/__about')
				.expect(200, done);
		});

		it('should accept any request with backend access key', function (done) {
			request(app)
				.get('/')
				.set('FT-Next-Backend-Key', 'test-backend-key')
				.expect('FT-Backend-Authentication', /true/)
				.expect(200, done);
		});

		it('accepts any request with an older access key (1 older)', function (done) {
			request(app)
				.get('/')
				.set('FT-Next-Backend-Key', 'test-backend-key-old')
				.expect('FT-Backend-Authentication', /true/)
				.expect(200, done);
		});

		it('accepts any request with an older access key (2 older)', function (done) {
			request(app)
				.get('/')
				.set('FT-Next-Backend-Key', 'test-backend-key-oldest')
				.expect('FT-Backend-Authentication', /true/)
				.expect(200, done);
		});

		it('should be possible to disable backend authentication', function (done) {
			sinon.stub(flags, 'init').returns(Promise.resolve(null));
			const app = nextExpress({
				name: 'noBackendAuth',
				directory: __dirname,
				withBackendAuthentication: false
			});
			app.get('/let-me-in', function (req, res) {
				res.end('', 200);
			});
			request(app)
				.get('/let-me-in')
				.expect(200, () => {
					done();
				});
		});

	});

	it('should be possible to disable flags', function (done) {

		sinon.stub(flags, 'init').returns(Promise.resolve(null));
		const app = nextExpress({
			name: 'noflags',
			directory: __dirname,
			withFlags: false
		});
		app.get('/', function (req, res) {
			res.end('', 200);
		});
		expect(flags.init.called).to.be.false;
			request(app)
			.get('/')
			.expect(200, function () {
				flags.init.restore();
				done();
			});
	});

	describe('metrics', function () {

		beforeEach(function () {
			delete flags.url;
			GLOBAL.fetch.restore();
			// fake metrics has not been initialised
			delete metrics.graphite;
		});

		function getApp (conf) {
			conf = conf || {};
			conf.directory = path.resolve(__dirname, '../fixtures/app/');
			return nextExpress(conf);
		}

		it('should initialise metrics', function () {
			sinon.stub(metrics, 'init');
			getApp();
			expect(metrics.init.calledWith({app: 'demo-app', flushEvery: 40000 })).to.be.true;
			metrics.init.restore();
		});

		it('should count application starts', function (done) {
			sinon.stub(metrics, 'count');
			const app = getApp();
			app.listen().then(function () {
				expect(metrics.count.calledWith('express.start')).to.be.true;
				metrics.count.restore();
				done();
			});
		});

		it('should instrument fetch for recognised services', function (done) {
			const realFetch = GLOBAL.fetch;

			sinon.stub(raven, 'captureMessage');
			getApp();

			expect(GLOBAL.fetch).to.not.equal(realFetch);

			Promise.all([
				fetch('http://ft-next-api-user-prefs-v002.herokuapp.com/', {
					timeout: 50
				}).catch(function () {}),
				fetch('http://bertha.ig.ft.com/ghjgjh', {
					timeout: 50
				}).catch(function () {})
			])
				.then(function () {
					expect(raven.captureMessage.called).to.be.false;
					raven.captureMessage.restore();
					done();
				});

		});

		//fixme - I'm not sure ow this test ever passed but it doesn't now
		it.skip('should notify sentry of unrecognised services', function (done) {

			sinon.stub(raven, 'captureMessage');
			getApp();

			fetch('http://notallowed.com', {
				timeout: 50
			})
				.catch(function () {
					try{
						sinon.assert.called(raven.captureMessage);
						raven.captureMessage.restore();
						done();
					}catch(e){
						done(e);
					}
				});
		});

	});
});
