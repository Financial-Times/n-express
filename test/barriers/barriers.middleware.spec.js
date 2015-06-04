'use strict';
/*global describe, it, before, afterEach, after*/
var express = require('express');
var sinon = require('sinon');
var request = require('supertest');
var expect = require('chai').expect;
var mockery = require('mockery');

var middleware;

describe('Middleware', function(){

	var app, routeHandler, routeHandlerSpy, locals;

	var barriersFlag = true;
	var firstClickFreeFlag = false;

	before(function(){
		middleware = require('../../src/barriers/middleware');
		app = express();
		routeHandler = function(req, res){
			locals = res.locals;
			res.status(200).end();
		};
		routeHandlerSpy = sinon.spy(routeHandler);
		app.use(function(req, res, next){
			res.locals.flags = {barrier:barriersFlag, firstClickFree:firstClickFreeFlag};
			next();
		});
		app.use(middleware);
		app.get('/*', routeHandlerSpy);
		app.listen(4444);
	});

	after(function(){
		mockery.disable();
	});

	afterEach(function(){
		routeHandlerSpy.reset();
		barriersFlag = true;
	});

	var barrierType = "PREMIUM",
		sessionId = "kjvbjkvbrv",
		asyc = "dvsvsv",
		countryCode = "GBR",
		contentClassification = "PREMIUM_CONTENT";


	function setup(){
		return request(app)
			.get('/blah')
			.set('X-FT-Auth-Gate-Result', 'DENIED')
			.set('X-FT-Barrier-Type', barrierType)
			.set('X-FT-Session-Token', sessionId)
			.set('X-FT-AYSC', asyc)
			.set('Country-Code', countryCode)
			.set('X-FT-Content-Classification', contentClassification);
	}

	it('Should redirect if barriers flag is off', function(done){
		barriersFlag = false;
		request(app)
			.get('/blah')
			.set('X-FT-Auth-Gate-Result', 'DENIED')
			.set('X-FT-Barrier-Type', 'PREMIUM')
			.expect('Location', 'https://registration.ft.com/registration/barrier/login?location=http://next.ft.com/blah')
			.expect(302, done);
	});

	it('Should vary on the X-FT-Anonymous-User header', function(done){
		setup()
			.expect('Vary', /X-FT-Anonymous-User/)
			.expect(200, done);
	});

	it('Should set a barrier property to true if there is a barrier to show', function(done){
		setup()
			.expect(function(){
				expect(locals.barrier).to.be.true;
			})
			.end(done);
	});

	it('Should add a barriers model to res.locals', function(done){
		setup()
			.expect(function(){
				expect(locals.barriers).to.have.property('premiumBarrier');
			})
			.end(done);
	});

	it('Should set barrier property to false if the firstClickFree flag is active', function(done){
		firstClickFreeFlag = true;
		setup()
			.expect(function(){
				expect(locals.barrier).to.be.false;
			})
			.end(done);
	});
});
