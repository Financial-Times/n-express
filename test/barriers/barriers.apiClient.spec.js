'use strict';
/*global describe, before, it, after*/

var fetchMock = require('fetch-mock');
var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');

var reqMock = {
	_headers : {
		'X-FT-Session-Token' : 'kfjejkrbverv',
		'Country-Code' : 'GBR',
		'X-FT-Content-Classification' : 'CONDITIONAL_STANDARD',
		'X-FT-AYSC' : 'dfdfbfdbfdbfdb'
	},
	'get' : function(header) {
		return reqMock._headers[header];
	}
};

var reqErrorMock = {
	get : function() {
		return null;
	}
};

describe('Barrier API Client', function() {

	var endpoints = {
		test : /barrier-app-test\.memb\.ft\.com/,
		prod : /subscribe\.ft\.com/
	};

	var mockSuccessRoute = {
		name : 'Barrier API',
		matcher : endpoints.prod,
		response : {
			foo : 'bar'
		}
	};

	var mockErrorRoute  = {
		name : 'Barrier API',
		matcher : endpoints.prod,
		response : 500
	};

	var barrierAPIClient;

	var errorHandlerMock = {
		captureError : sinon.spy()
	};



	before(function() {
		mockery.enable({warnOnUnregistered:false});
		mockery.registerMock('express-errors-handler', errorHandlerMock);
		barrierAPIClient = require('../../src/barriers/barrierAPIClient');
		fetchMock.mock({routes : mockSuccessRoute});
	});

	after(function() {
		mockery.disable();
		fetchMock.restore();
	});

	it('Should be able to build an API request from the req object', function(done) {
		barrierAPIClient.getBarrierData(reqMock).then(function(json) {
			var headers = fetchMock.calls('Barrier API')[0][1].headers;
			expect(headers.AYSC).to.equal(reqMock._headers['X-FT-AYSC']);
			expect(headers['Content-Classification']).to.equal(reqMock._headers['X-FT-Content-Classification']);
			expect(headers['Session-Id']).to.equal(reqMock._headers['X-FT-Session-Token']);
			expect(headers['Country-Code']).to.equal(reqMock._headers['Country-Code']);
			done();
		}).catch(done);
	});

	it('Should parse the response as json and return this', function(done) {
		barrierAPIClient.getBarrierData(reqMock).then(function(json) {
			expect(json).to.have.property('foo');
			expect(json.foo).to.equal('bar');
			done();
		}).catch(done);
	});

	it('Should handle 500 responses from the server', function(done) {
		fetchMock.reMock({routes:mockErrorRoute});
		barrierAPIClient.getBarrierData(reqErrorMock).then(function() {
			done(new Error('This call should not succeed'));
		}).catch(function(err) {
			try {
				done();
			} catch(err) {
				done(err);
			}
		});
	});

	//todo fix this test.  mockery is not working for some reason
	it.skip('Should capture errors thrown by the Barrier API', function(done){
		fetchMock.reMock({routes:mockErrorRoute});
		barrierAPIClient.getBarrierData(reqErrorMock).then(function() {
			done(new Error('This call should not succeed'));
		}).catch(function(err) {
			try{
				sinon.assert.called(errorHandlerMock.captureError);
				done();
			}catch(e){
				done(e);
			}
		});
	});
});
