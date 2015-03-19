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

describe('simple app', function() {

	it('should have its own route', function(done) {
		request(app)
			.get('/')
			.expect('Vary', /X-Flags/)
			.expect(200, 'Hello world', done);
	});

	it('should have a robots.txt', function(done) {
		request(app)
			.get('/robots.txt')
			.expect(200, done);
	});

	it('should have a static resource', function(done) {
		request(app)
			.get('/demo-app/test.txt')
			.expect('Cache-Control', /stale-if-error/)
			.expect('Cache-Control', /stale-while-revalidate/)
			.expect(200, 'Static file\n', done);
	});

	describe('metrics', function () {

		beforeEach(function () {
			console.log(flags.url);
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
				'capi-v1-article': 'http://api.ft.com/content/items/v1/1234-abcd',
				'capi-v1-page': 'http://api.ft.com/site/v1/pages/1234-abcd',
				'capi-v1-pages-list': 'http://api.ft.com/site/v1/pages',
				'sapi': 'http://api.ft.com/content/search/v1',
				'user-prefs': 'http://ft-next-api-user-prefs-v002.herokuapp.com/',
				'flags': 'http://ft-next-api-feature-flags.herokuapp.com/production',
				// For some reason elastic search url breaks the tests.
				// 'elastic-v1-atricle': 'http://abcd-1234.foundcluster.com:9243/v1_api_v2/item',
				// 'elastic-search':
				'capi-v2-article': 'http://api.ft.com/content/1234-abcd',
				'capi-v2-enriched-article': 'http://api.ft.com/enrichedcontent/1234-abcd',
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
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*header(.|[\r\n])*addscripts(.|[\r\n])*<\/html>/, done);
		});

		it('wrapper should expose app name to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /<html.*data-next-app="demo-app"/, done);
		});

		it('wrapper should expose offy flags to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /<html.*data-next-flags="(([a-z\-]+--off))( [a-z\-]+--off)*"/, done);
		});

		it('should be possible to inherit a vanilla (inc html head only) layout', function(done) {
			request(app)
				.get('/vanilla')
				// doctype ... no header ... script loader ... tracking ... end page
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*<body>([^a-z])*<h1>(.|[\r\n])*addscripts([\t]+)tracking*/, done);
		});

		it('vanilla should expose app name to client side code', function(done) {
			request(app)
				.get('/vanilla')
				.expect(200, /<html.*data-next-app="demo-app"/, done);
		});
		it('vanilla should expose offy flags to client side code', function(done) {
			request(app)
				.get('/wrapped')
				.expect(200, /<html.*data-next-flags="(([a-z\-]+--off))( [a-z\-]+--off)*"/, done);
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



		it('should provide inheritance helpers', function(done) {
			request(app)
				.get('/templated')
				.expect(200, /block1default block2override/, done);
		});

		it('should treat undefined flags as offy (like falsey)', function(done) {
			request(app)
				.get('/templated')
				// Currently fails - suggest we just ditch this feature, as per
				// https://github.com/Financial-Times/next-feature-flags-client/issues/26
				//.expect(/<undefinedflag-off>Should appear<\/undefinedflag-off>/)
				.expect(200, /<undefinedflag-on><\/undefinedflag-on>/, done);
		});

		describe('iteration helpers', function () {
			it('should provide an slice helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /slice\:34\:end/, done);
			});
		});

		describe('logic helpers', function () {
			it('should provide an if equals helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /ifEquals\:first not second/, done);
			});

			it('should provide an if all helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /ifAll\:first not second/, done);
			});

			it('should provide an if some helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /ifSome\:first not second/, done);
			});
		});

		describe('content helpers', function () {

			it('should provide a nice paragraphs helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /Start Paragraphs<p>Paragraph 2<\/p>End Paragraphs/, done);
			});

			it('should provide a nice image stripping helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /ImageEndImage/, done);
			});

			it('should provide a nice date helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /Full date: Friday, 1 August, 2014/, done);
			});

			it('should provide a nice date helper that lets you easily output the date in an o-date compatible format', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /ISO date: 2014-08-01T00:00:00Z/, done);
			});

			it('should provide a uri encoding helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /http\:\/\/domain\.com\?q=this%20\/%20that http%3A%2F%2Fdomain\.com%3Fq%3Dthis%20%2F%20that/, done);
			});

			it('should provide a topic url helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /\/page\/read it \/stream\/section\/segment it/, done);
			});

			it('should provide an image resizing helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /\/\/image\.webservices.ft.com\/v1\/images\/raw\/http%3A%2F%2Fimage\.jpg\?width=200&source=next&fit=scale-down/, done);
			});

			it('should provide a json helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /\{&quot;prop&quot;:&quot;val&quot;\}/, done);
			});

			it('should provide a dynamic partials helper', function(done) {
				request(app)
					.get('/templated')
					.expect(200, /dynamic-partial/, done)
					.expect(200, /dynamicroot-iamroot/, done);
			});

		});

	});

});
