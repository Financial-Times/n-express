/*global it, describe, beforeEach, before, after*/
"use strict";

var request = require('supertest');
var app = require('../fixtures/app/main');
var metrics = require('next-metrics');
var sinon = require('sinon');
var nextExpress = require('../../main');
var expect = require('chai').expect;
var raven = require('@financial-times/n-raven');
var flags = require('next-feature-flags-client');
var handlebars = require('@financial-times/n-handlebars');


describe('vary middleware', function () {

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
			.expect('vary', 'x-flags, ft-anonymous-user')
			.expect(200, done);

	});

	it('extend vary header using single value', function (done) {
		request(app)
			.get('/single-vary')
			.expect('vary', 'x-flags, ft-anonymous-user, test-vary')
			.expect(200, done);
	});

	it('extend vary header using vary method', function (done) {
		request(app)
			.get('/vary-method')
			.expect('vary', 'x-flags, ft-anonymous-user, test-vary')
			.expect(200, done);
	});

	it('extend vary header using array of values', function (done) {
		request(app)
			.get('/array-vary')
			.expect('vary', 'x-flags, ft-anonymous-user, test-vary1, test-vary2')
			.expect(200, done);
	});

	it('won\'t duplicate vary headers', function (done) {
		request(app)
			.get('/duplicate-vary')
			.expect('vary', 'x-flags, ft-anonymous-user')
			.expect(200, done);
	});

	it('extend vary header using a map', function (done) {
		request(app)
			.get('/multiple-vary')
			.expect('test-header', 'is-set')
			.expect('vary', 'x-flags, ft-anonymous-user, test-vary')
			.expect(200, done);
	});

	it('unset single vary header', function (done) {
		request(app)
			.get('/unset-vary')
			.expect('vary', 'x-flags, ft-anonymous-user')
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
			.expect('vary', 'x-flags, ft-anonymous-user, test-vary')
			.expect(200, done);
	});

});
