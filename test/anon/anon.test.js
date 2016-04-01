'use strict';
/*global describe, it, beforeEach*/
var request = require('supertest');
var nextExpress = require('../../main');
var expect = require('chai').expect;

describe('Anonymous Middleware', function() {
	var app;
	var locals;

	beforeEach(function(){
		app = nextExpress({ withFlags:true, withHandlebars:false, withAnonMiddleware:true });
		app.get('/', function(req, res){
			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should set the res.locals.anon property', function(done){
		request(app)
			.get('/')
			.expect(function(){
				expect(locals.anon).to.be.defined;
			})
			.end(done);
	});

	it('Should set the res.locals.userIsAnoymous property based on the X-FT-Anonymous-User header', function(done){
		request(app)
			.get('/')
			.set('X-FT-Anonymous-User', 'true')
			.expect(function(){
				expect(locals.anon.userIsAnonymous).to.be.true;
			})
			.end(done);
	});

	it('Should provide a firstClickFree model when required', function(done){
		request(app)
			.get('/')
			.set('FT-Access-Decision', 'GRANTED')
			.set('FT-Access-Decision-Policy', 'PRIVILEGED_REFERER_POLICY')
			.set('X-Flags', 'firstClickFree:on')
			.expect(function(){
				expect(locals.firstClickFreeModel).to.be.an('object');
				expect(locals.firstClickFreeModel).to.have.property('signInLink');
				expect(locals.firstClickFreeModel).to.have.property('subscribeNowLink');
			})
			.end(done);
	});
});
