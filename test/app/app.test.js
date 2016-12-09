/*global it, describe, beforeEach, before, after*/
'use strict';
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
const handlebars = require('@financial-times/n-handlebars');
const verifyAssetsExist = require('../../src/lib/verify-assets-exist');

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

	it('should have its own route', function(done) {
		request(app)
			.get('/')
			.expect('Vary', /FT-Flags/i)
			.expect(200, 'Hello world', done);
	});

	it('should be possible to add routers', function(done) {
		request(app)
			.get('/router/')
			.expect('Vary', /FT-Flags/i)
			.expect(200, 'Hello router', done);
	});

	it('should have a robots.txt', function(done) {
		request(app)
			.get('/robots.txt')
			.expect(200, done);
	});

	it('should have an about json', function(done) {
		request(app)
			.get('/__about')
			.expect(200, done);
	});

	it('should have a static resource', function(done) {
		request(app)
			.get('/demo-app/test.txt')
			.expect(200, 'Static file\n', done);
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

		it('should allow static assets through without backend access key', function (done) {
			request(app)
				.get('/demo-app/test.txt')
				.expect(200, done);
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
			sinon.stub(verifyAssetsExist, 'verify');
			const app = nextExpress({
				name: 'noBackendAuth',
				directory: __dirname,
				withHandlebars: false,
				withBackendAuthentication: false
			});
			app.get('/let-me-in', function (req, res) {
				res.end('', 200);
			});
			request(app)
				.get('/let-me-in')
				.expect(200, () => {
					verifyAssetsExist.verify.restore();
					done();
				});
		});

	});

	it('should be possible to disable flags', function (done) {

		sinon.stub(verifyAssetsExist, 'verify');
		sinon.stub(flags, 'init').returns(Promise.resolve(null));
		const app = nextExpress({
			name: 'noflags',
			directory: __dirname,
			withHandlebars: false,
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
				verifyAssetsExist.verify.restore();
				done();
			});
	});

	it('should be possible to disable handlebars', function (done) {
		sinon.stub(handlebars, 'handlebars');
		sinon.stub(verifyAssetsExist, 'verify');
		const app = nextExpress({
			name: 'nohandles',
			directory: __dirname,
			withHandlebars: false
		});
		app.get('/', function (req, res) {
			res.end('', 200);
		});
		expect(handlebars.handlebars.called).to.be.false;
			request(app)
			.get('/')
			.expect(200, function () {
				handlebars.handlebars.restore();
				verifyAssetsExist.verify.restore();
				done();
			});
	});


	// By default, app.withHandlebars is true
	it('should add a `FT-Force-Opt-In-Device` header to the vary for all apps that use handlebars', function (done) {
		request(app)
			.get('/')
			.expect('Vary', /FT-Force-Opt-In-Device/i)
			.expect(200, 'Hello world', done);
	});

	it('should add the AB test state to locals', function (done) {
		request(app)
			.get('/templated')
			.set('FT-AB', 'someAbTest:variant')
			.expect(200, /<div id="ab-state">someAbTest\:variant<\/div>/, done);
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
				.catch(function (err) {
					console.log(err);
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

	describe('templating', function () {

		it('should do templating', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /FT/, done);
		});

		it('should not inherit any markup by default', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /^<h1>FT - on/, done);
		});

		it('should be possible to inherit a layout', function(done) {
			request(app)
				.get('/with-layout')
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*head(.|[\r\n])*body(.|[\r\n])*h1(.|[\r\n])*h2(.|[\r\n])*<\/html>/, done);
		});

		//fixme - this test breaks on Travis
		it.skip('should integrate with the image service', function(done) {
			const expected = process.env.TRAVIS ?
				/image\.webservices\.ft\.com\/v1\/images\/raw/ :
				/next-geebee\.ft\.com\/image\/v1\/images\/raw/;
			request(app)
				.get('/templated')
				.expect(200, expected, done);
		});

		it('should support loading partials via bower', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /End of dep 2 partial/, done);
		});

		it('should support app-specific helpers', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /HELLO/, done);
		});

		it('should expose app name to views', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /on app demo-app/, done);
		});

		describe('n-handlebars features', function () {

			// these two helpers
			// a) provide a sample of n-handlebars' features to make sure it is being consumed at all
			// b) are the trickiest ones most likely to break
			it('should provide inheritance helpers', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /block1default block2override/, done);
			});
			it('should provide a dynamic partials helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /dynamic-partial/, done)
					.expect(200, /dynamicroot-iamroot/, done);
			});
		});

		it('should treat undefined flags as offy (like falsey)', function(done) {
			request(app)
				.get('/templated')
				// Currently fails - suggest we just ditch this feature, as per
				// https://github.com/Financial-Times/next-feature-flags-client/issues/26
				//.expect(/<undefinedflag-off>Should appear<\/undefinedflag-off>/)
				.expect(200, /<undefinedflag-on><\/undefinedflag-on>/, done);
		});

	});

	describe('hashed assets and preloading', () => {

		it('should preload main.css, main-with-n-ui.js and polyfill', done => {
			request(app)
				.get('/templated')
				.expect('Link', /<\/\/next-geebee\.ft\.com\/.*polyfill.min\.js.*>; as="script"; rel="preload"; nopush/)
				.expect('Link', /<\/\/www\.ft\.com\/__assets\/n-ui\/cached\/v1\/es5\.min\.js>; as="script"; rel="preload"; nopush/)
				.expect('Link', /<\/demo-app\/main-without-n-ui\.js>; as="script"; rel="preload"; nopush/, done)
		});

		it('should not preload anything by default on non text/html requests', done => {
			request(app)
				.get('/non-html')
				.end((err, res) => {
					expect(res.headers.link).to.not.exist;
					done();
				})
		});

		it('should preload main-variant.css as appropriate', done => {
			request(app)
				.get('/templated?cssVariant=variant')
				.expect('Link', /<\/demo-app\/main-variant\.css>; as="style"; rel="preload"; nopush/, done)
		});

		it('should be possible to preload any file on any request', done => {
			request(app)
				.get('/non-html?preload=true')
				.expect('Link', '</demo-app/it.js>; rel="preload"; as="script"; nopush, <https://place.com/it.js>; rel="preload"; as="script"; nopush', done)
		});

	})
});
