/*global it, describe, before, after*/
const request = require('supertest');

// stub the setup api calls
const fetchMock = require('fetch-mock');
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
