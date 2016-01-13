'use strict';
/*global describe, it, beforeEach*/
var request = require('supertest');
var nextExpress = require('../../main');
var expect = require('chai').expect;

describe('Navigation model', function() {
	var app;
	var locals;

	beforeEach(function(){
		app = nextExpress({ withFlags:true, withHandlebars:true });
		app.get('/', function(req, res){
			locals = res.locals;
			res.sendStatus(200).end();
		});
	});

	it('Should set the myFT property to an object', function(done){
		request(app)
			.get('/')
			.set('FT-User-UUID', 'xvdsvdfvdfs')
			.expect(function(){
				expect(locals.navigationModel.myFT).to.be.an('object');
			})
			.end(done);
	});

	it('Should set the myAccount property to an object if user is not anonymous', function(done){
		request(app)
			.get('/')
			.set('FT-User-UUID', 'dkvbdfkjvbh')
			.expect(function(){
				expect(locals.navigationModel.myAccount).to.be.an('object');
			})
			.end(done);
	});
});
