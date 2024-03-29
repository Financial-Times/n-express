/*global it, global, describe, beforeEach, before, after*/
const path = require('path');
const request = require('supertest');

// stub the setup api calls
const fetchMock = require('fetch-mock');
const metrics = require('next-metrics');
const sinon = require('sinon');
const nextExpress = require('../../main');
const expect = require('chai').expect;
const flags = require('@financial-times/n-flags-client');

let app;

describe('simple app', function () {
	before(() => {
		fetchMock
			.mock(/next-flags-api\.ft\.com/, [])
			.mock(
				'http://ft-next-health-eu.herokuapp.com/failure-simulation-config',
				{ failures: [] }
			)
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
		request(app).get('/robots.txt').expect(200, done);
	});

	describe('backend access', function () {
		before(function () {
			process.env.NODE_ENV = 'production';
		});

		after(function () {
			process.env.NODE_ENV = '';
		});

		it('should have no backend authentication when no keys present', function (done) {
			request(app)
				.get('/let-me-in')
				.expect(200, () => {
					done();
				});
		});
	});

	describe('metrics', function () {
		let metricsApp;

		beforeEach(function () {
			delete flags.url;
			global.fetch.restore();
			// fake metrics has not been initialised
			delete metrics.graphite;
		});

		afterEach(function () {
			metricsApp.close();
		});

		function getApp (conf) {
			conf = conf || {};
			conf.directory = path.resolve(__dirname, '../fixtures/app/');
			conf.systemCode = 'test-app';
			return nextExpress(conf);
		}

		it('should initialise metrics', function () {
			sinon.stub(metrics, 'init');
			metricsApp = getApp();
			expect(metrics.init.calledWith({ flushEvery: 40000 })).to.be.true;
			metrics.init.restore();
		});

		it('should initialise metrics for variant apps', function () {
			sinon.stub(metrics, 'init');
			process.env.FT_APP_VARIANT = 'testing';
			metricsApp = getApp();
			expect(metrics.init.calledWith({ flushEvery: 40000 })).to.be.true;
			metrics.init.restore();
			delete process.env.FT_APP_VARIANT;
		});

		it('should count application starts', async function () {
			sinon.stub(metrics, 'count');

			metricsApp = getApp();
			await metricsApp.listen();

			expect(metrics.count.calledWith('express.start')).to.be.true;
			metrics.count.restore();
		});

		it('should instrument fetch for recognised services', async function () {
			const realFetch = global.fetch;

			metricsApp = getApp();

			expect(global.fetch).to.not.equal(realFetch);

			await Promise.all([
				fetch('http://ft-next-api-user-prefs-v002.herokuapp.com/', {
					timeout: 50
				}).catch(() => {}),
				fetch('http://bertha.ig.ft.com/ghjgjh', {
					timeout: 50
				}).catch(() => {})
			]);
		});
	});

	describe('config', () => {
		it('should be possible to disable flags', function (done) {
			sinon.stub(flags, 'init').returns(Promise.resolve(null));
			const app = nextExpress({
				name: 'noflags',
				directory: __dirname,
				systemCode: 'test-app',
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
			setTimeout(() => app.close(), 0);
		});

		it('should expect a system code', () => {
			expect(() => {
				const app = nextExpress({
					name: 'nosystem',
					directory: __dirname,
					withFlags: false
				});
				setTimeout(() => app.close(), 0);
			}).to.throw(
				'All applications must specify a Biz Ops `systemCode` to the express() function. See the README for more details.'
			);
		});
	});

	after(() => {
		app.close();
	});
});
