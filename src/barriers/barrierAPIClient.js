'use strict';
/*global fetch*/
require('isomorphic-fetch');
var debug = require('debug')('ft-next-barrier-component');
var util = require('util');

var endpoints = {
	test : 'http://barrier-app-test.memb.ft.com/memb/barrier/v1',
	prod : 'https://subscribe.ft.com/memb/barrier/v1'
};

function getRequestHeaders(req){
	return {
		"Session-Id": req.get('X-FT-Session-Token'),
		"Country-Code": req.get('Country-Code'),
		"Content-Classification": req.get('X-FT-Content-Classification'),
		"AYSC": req.get('X-FT-AYSC')
	};
}

function getBarrierData(req){
	var requestHeaders = getRequestHeaders(req);
	return fetch(endpoints.prod,{headers: requestHeaders}).then(function(response){

		if(!response.ok){
			var msg = util.format(
				"Failed to fetch barrier data.  status=%s, requestHeaders=%j, responseHeaders=%j",
				response.status,
				requestHeaders,
				response.headers
			);
			debug(msg);
		}

		return response.json();
	});
}

module.exports = {
	getBarrierData : getBarrierData
};
