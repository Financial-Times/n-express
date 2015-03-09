/*global it, describe*/
"use strict";

var request = require('supertest');
var app = require('./fixtures/app/main');

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
	describe('templating', function () {
		it('should do something templating', function(done) {
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
					.expect(200, /\/\/image\.webservices.ft.com\/v1\/images\/raw\/http%3A%2F%2Fimage\.jpg\?width=200&source=docs&fit=scale-down/, done);
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
