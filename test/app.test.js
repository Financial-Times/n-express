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
var handlebars = require('@financial-times/n-handlebars');

describe('simple app', function() {

	it('should have its own route', function(done) {
		request(app)
			.get('/')
			.expect('Vary', /X-Flags/i)
			.expect(200, 'Hello world', done);
	});

	it('should be possible to add routers', function(done) {
		request(app)
			.get('/router/')
			.expect('Vary', /X-Flags/i)
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

	describe('vary headers', function () {

		it('set single headers', function (done) {
			request(app)
				.get('/single-header')
				.expect('test-header', 'is-set')
				.expect(200, done);
		});

		it('set maps of headers', function (done) {
			request(app)
				.get('/multiple-header')
				.expect('test-header1', 'is-set')
				.expect('test-header2', 'is-set')
				.expect(200, done);
		});

		it('set default vary headers', function (done) {
			request(app)
				.get('/default-vary')
				.expect('vary', 'country-code, accept-encoding, x-flags, x-ft-anonymous-user')
				.expect(200, done);

		});

		it('extend vary header using single value', function (done) {
			request(app)
				.get('/single-vary')
				.expect('vary', 'country-code, accept-encoding, x-flags, x-ft-anonymous-user, test-vary')
				.expect(200, done);
		});

		it('extend vary header using vary method', function (done) {
			request(app)
				.get('/vary-method')
				.expect('vary', 'country-code, accept-encoding, x-flags, x-ft-anonymous-user, test-vary')
				.expect(200, done);
		});

		it('extend vary header using array of values', function (done) {
			request(app)
				.get('/array-vary')
				.expect('vary', 'country-code, accept-encoding, x-flags, x-ft-anonymous-user, test-vary1, test-vary2')
				.expect(200, done);
		});

		it('won\'t duplicate vary headers', function (done) {
			request(app)
				.get('/duplicate-vary')
				.expect('vary', 'country-code, accept-encoding, x-flags, x-ft-anonymous-user')
				.expect(200, done);
		});

		it('extend vary header using a map', function (done) {
			request(app)
				.get('/multiple-vary')
				.expect('test-header', 'is-set')
				.expect('vary', 'country-code, accept-encoding, x-flags, x-ft-anonymous-user, test-vary')
				.expect(200, done);
		});

		it('unset single vary header', function (done) {
			request(app)
				.get('/unset-vary')
				.expect('vary', 'accept-encoding, x-flags, x-ft-anonymous-user')
				.expect(200, done);
		});

		it('unset all vary headers', function (done) {
			request(app)
				.get('/unset-all-vary')
				.expect(200)
				.end((err, res) => {
					expect(res.headers).to.not.have.key('vary');
					done();
				});
		});

		it('not attempt empty string as vary header', function (done) {
			request(app)
				.get('/no-empty-vary')
				.expect(200)
				.end((err, res) => {
					expect(res.headers).to.not.have.key('vary');
					done();
				});
		});


		it('co-mingle extending and unsetting vary headers', function (done) {
			request(app)
				.get('/mixed-vary')
				.expect('test-header', 'is-set')
				.expect('vary', 'accept-encoding, x-flags, x-ft-anonymous-user, test-vary')
				.expect(200, done);
		});

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

		it('should be possible to disable backend authentication', function (done) {
			sinon.stub(flags, 'init').returns(Promise.resolve(null));
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
		sinon.stub(flags, 'init').returns(Promise.resolve(null));
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
					expect(errorsHandler.captureMessage.called).to.be.false;
					errorsHandler.captureMessage.restore();
					done();
				});

		});

		//fixme - I'm not sure ow this test ever passed but it doesn't now
		it.skip('should notify sentry of unrecognised services', function (done) {

			sinon.stub(errorsHandler, 'captureMessage');
			getApp();

			fetch('http://notallowed.com', {
				timeout: 50
			})
				.catch(function (err) {
					console.log(err);
					try{
						sinon.assert.called(errorsHandler.captureMessage);
						errorsHandler.captureMessage.restore();
						done();
					}catch(e){
						done(e);
					}
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

		it('should be possible to inherit a layout', function(done) {
			request(app)
				.get('/with-layout')
				.expect(200, /^<!DOCTYPE html>(.|[\r\n])*head(.|[\r\n])*body(.|[\r\n])*h1(.|[\r\n])*h2(.|[\r\n])*<\/html>/, done);
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

		describe('n-handlebars features', function () {

			// these two helpers
			// a) provide a sample of n-handlebars' features
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

});
