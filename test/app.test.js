/*global it, describe, beforeEach*/
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

	it('should have a static resource', function(done) {
		request(app)
			.get('/demo-app/test.txt')
			.expect(200, 'Static file\n', done);
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
			var services = {
				'ft.com': 'http://www.ft.com/cms/s/380e7966-b07f-11e4-9b8e-00144feab7de.html',
				'capi-v1-article': 'http://api.ft.com/content/items/v1/1234-abcd',
				'capi-v1-page': 'http://api.ft.com/site/v1/pages/1234-abcd',
				'capi-v1-pages-list': 'http://api.ft.com/site/v1/pages',
				'sapi': 'http://api.ft.com/content/search/v1',
				'user-prefs': 'http://ft-next-api-user-prefs-v002.herokuapp.com/',
				'flags': 'http://ft-next-api-feature-flags.herokuapp.com/__flags.json',
				// For some reason elastic search url breaks the tests.
				// 'elastic-v1-atricle': 'http://abcd-1234.foundcluster.com:9243/v1_api_v2/item',
				// 'elastic-search':
				'capi-v2-article': 'http://api.ft.com/content/1234-abcd',
				'capi-v2-enriched-article': 'http://api.ft.com/enrichedcontent/1234-abcd',
				'capi-v2-thing': 'http://api.ft.com/things/1234-abcd',
				'capi-v2-people': 'http://api.ft.com/people/1234-abcd',
				'capi-v2-organisation': 'http://api.ft.com/organisations/1234-abcd',
				'capi-v2-content-by-concept': 'http://api.ft.com/content?isAnnotatedBy=http://api.ft.com/things/1234-abcd',
				'hello': 'http://world.com'
			};
			Promise.all(Object.keys(services).map(function (serv) {
				return fetch(services[serv], {
					timeout: 50
				}).catch(function () {});
			}))
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
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*header(.|[\r\n])*flags(.|[\r\n])*script-loader(.|[\r\n])*<\/html>/, done);
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
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*<body class="o-hoverable-on">([^a-z])*<h1>(.|[\r\n])*flags(.|[\r\n])*script-loader([\t]+)tracking*/, done);
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
		it('should integrate with the image service', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /\/\/image.webservices.ft.com\/v1\/images\/raw\//, done);
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
	});


});
