'use strict';
var app = require('./fixtures/app/main');
var request = require('supertest');
var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;

describe('Session Middleware', function(){

	var session, cookie;

	before(function(){
		cookie = fs.readFileSync(path.resolve(__dirname, './fixtures/cookies.txt'), {encoding:'utf8'});
		return app.listen;
	});

	// Note [PW] this uses a real session, so at some point that will expire and this test will fail
	it('Should be able to get the user details associated with the current session', function(done){
		request(app)
			.get('/session')
			.set('Cookie', cookie)
			.expect(function(response){
				expect(response.body).to.have.property('erightsId');
				expect(response.body).to.have.property('uuid');
			})
			.expect(200,done);
	});

});
