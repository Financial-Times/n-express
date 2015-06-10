'use strict';
/*global describe, it, beforeEach*/
var request = require('supertest');
var nextExpress = require('../../main');
var expect = require('chai').expect;


describe('Anonymous Middleware', function(){

	var app, locals;

	beforeEach(function(){
		app = nextExpress({withFlags:true,withHandlebars:true});
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

	describe('Navigation model', function(){

		//todo [PW 9/6/15] this stuff doesn't belong here but not sure where it should go

		it('Should set the myFT property to an object if user is not anonymous', function(done){
			request(app)
				.get('/')
				.set('FT-Session-Token', 'xvdsvdfvdfs')
				.expect(function(){
					expect(locals.navigationModel.myFT).to.be.an('object');
				})
				.end(done);
		});

		it('Should set the myFT property to an object if anonymousMyFt flag is ON', function(done){
			request(app)
				.get('/')
				.set('FT-Session-Token', '')
				.set('X-Flags', 'anonymousMyFt:on')
				.expect(function(){
					expect(locals.navigationModel.myFT).to.be.an('object');
				})
				.end(done);
		});

		it('Should set the myAccount property to an object if user is not anonymous', function(done){
			request(app)
				.get('/')
				.set('FT-Session-Token', 'dkvbdfkjvbh')
				.expect(function(){
					expect(locals.navigationModel.myAccount).to.be.an('object');
				})
				.end(done);
		});

	});

});
