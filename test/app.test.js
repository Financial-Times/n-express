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

describe('simple app', function() {

	it('should have its own route', function(done) {
		request(app)
			.get('/')
			.expect('Vary', /X-Flags/)
			.expect(200, 'Hello world', done);
	});

	it('should be possible to add routers', function(done) {
		request(app)
			.get('/router/')
			.expect('Vary', /X-Flags/)
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
				.get('/vanilla')
				.expect('FT-Backend-Authentication', /false/)
				.expect(401, done);
		});

		it('should 401 for arbitrary route with incorrect backend access key in production', function (done) {
			request(app)
				.get('/vanilla')
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
				.get('/vanilla')
				.set('FT-Next-Backend-Key', 'test-backend-key')
				.expect('FT-Backend-Authentication', /true/)
				.expect(200, done);
		});

		it('should be possible to disable backend authentication', function (done) {
			sinon.stub(flags, 'init');
			var app = nextExpress({
				name: 'noBackendAuth',
				directory: __dirname,
				withBackendAuthentication: false
			});
			app.get('/let-me-in', function (req, res) {
				res.end('', 200);
			});
			request(app)
				.get('/let-me-in')
				.expect(200, done);
		});

	});



	it('should be possible to disable flags', function (done) {
		sinon.stub(flags, 'init');
		var app = nextExpress({
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

	it('should be possible to disable handlebars', function (done) {
		sinon.stub(handlebars, 'handlebars');
		var app = nextExpress({
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
			conf.directory = __dirname + '/fixtures/app/';
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
			var app = getApp();
			app.listen().then(function () {
				expect(metrics.count.calledWith('express.start')).to.be.true;
				metrics.count.restore();
				done();
			});
		});

		it('should instrument fetch for recognised services', function (done) {
			var realFetch = GLOBAL.fetch;

			sinon.stub(errorsHandler, 'captureMessage');
			getApp({
				serviceDependencies: {
					'hello': /^http:\/\/world/
				}
			});

			expect(GLOBAL.fetch).to.not.equal(realFetch);

			Promise.all([
				fetch('http://ft-next-api-user-prefs-v002.herokuapp.com/', {
					timeout: 50
				}).catch(function () {}),
				fetch('http://world.com', {
					timeout: 50
				}).catch(function () {})
			])
				.then(function () {
					expect(errorsHandler.captureMessage.called).to.be.false;
					errorsHandler.captureMessage.restore();
					done();
				});

		});

		it('should notify sentry of unrecognised services', function (done) {

			sinon.stub(errorsHandler, 'captureMessage');
			getApp();

			fetch('http://notallowed.com', {
				timeout: 50
			})
				.catch(function () {})
				.then(function () {
					expect(errorsHandler.captureMessage.called).to.be.true;
					errorsHandler.captureMessage.restore();
					done();
				});
		});

	});

	describe('metrics', function () {

		it('should serve monitoring', function(done) {
			request(app)
				.get('/__sensu')
				.expect('Content-Type', /json/)
				.expect('Cache-Control', /max-age=60/)
				.expect(function (res) {
					if (res.body[0].name !== 'custom-metric') throw new Error('Custom sensu check "custom-metric" not found');
					if (res.body[1].name !== 'error-rate') throw new Error('Default sensu check "error-rate" not found');
				})
				.end(done);
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

		it('should be possible to inherit a wrapper (inc header & footer) layout', function(done) {
			request(app)
				.get('/wrapped')
				// doctype ... header ... script loader ... end page
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*header(.|[\r\n])*footer(.|[\r\n])*flags(.|[\r\n])*script-loader(.|[\r\n])*<\/html>/, done);
		});

		it('wrapper should expose app name to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /<html.*data-next-app="demo-app"/, done);
		});

		it('wrapper should expose non production-ness to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200)
				.end(function (err, res) {
					console.log(res);
					expect(res.text.indexOf('data-next-is-production')).to.equal(-1);
					done();
				});
		});

		it('wrapper should expose production-ness to client side code', function(done) {
			request(app)
				.get('/wrapped?prod=true')
				.expect(200, /<html.*data-next-is-production/, done);
		});

		it('wrapper should expose app version to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /<html.*data-next-version="i-am-at-version-x"/, done);
		});


		it('wrapper should expose offy flags to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /<html.*data-next-flags="(([a-z\d\-]+--off))( [a-z\d\-]+--off)*"/, done);
		});

		it('should be possible to inherit a vanilla (inc html head only) layout', function(done) {
			request(app)
				.get('/vanilla')
				// doctype ... no header ... script loader ... tracking ... end page
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*<body [^>]+>([^a-z])*<h1>(.|[\r\n])*flags(.|[\r\n])*script-loader([\t]+)tracking*/, done);
		});

		it('vanilla should expose app name to client side code', function(done) {
			request(app)
				.get('/vanilla')
				.expect(200, /<html.*data-next-app="demo-app"/, done);
		});

		it('vanilla should expose non production-ness to client side code', function(done) {
			request(app)
				.get('/vanilla')
				.expect(200)
				.end(function (err, res) {
					expect(res.text.indexOf('data-next-is-production')).to.equal(-1);
					done();
				});
		});

		it('vanilla should expose production-ness to client side code', function(done) {
			request(app)
				.get('/vanilla?prod=true')
				.expect(200, /<html.*data-next-is-production/, done);
		});

		it('vanilla should expose app version to client side code', function(done) {
			request(app)
				.get('/vanilla')
				.expect(200, /<html.*data-next-version="i-am-at-version-x"/, done);
		});

		it('vanilla should expose offy flags to client side code', function(done) {
			request(app)
				.get('/vanilla')
				.expect(200, /<html.*data-next-flags="(([a-z\d\-]+--off))( [a-z\d\-]+--off)*"/, done);
		});

		//fixme - this test breaks on Travis
		it.skip('should integrate with the image service', function(done) {
			var expected = process.env.TRAVIS ?
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

		describe('next-handlebars features', function () {

			// these two helpers
			// a) provide a sample of next-handlebars' features
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


		it('should be able to set the base', function(done) {
			request(app)
				.get('/with-set-base')
				.expect(200, /<base target="_parent" href="\/\/next.ft.com">/, done);
		});

		it('should render open graph markup', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /property="og:url" content="1"/, done);
		});

		it('should render twitter card markup', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /property="twitter:image" content="http:\/\/foo\.png"/, done)
				.expect(200, /property="twitter:title" content="hello"/, done);
		});

	});

});
