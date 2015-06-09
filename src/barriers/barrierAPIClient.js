'use strict';
/*global fetch*/
require('isomorphic-fetch');
var debug = require('debug')('ft-next-barrier-component');
var util = require('util');
var fetchres = require('fetchres');
var ravenClient = require('express-errors-handler');

var endpoints = {
	test : 'https://barrier-app.memb.ft.com/memb/barrier/v1/barrier-data',
	prod : 'https://subscribe.ft.com/memb/barrier/v1/barrier-data'
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
	debug('Barriers API request url=%s headers=%j', endpoints.prod, requestHeaders);
	return fetch(endpoints.prod, { headers: requestHeaders })
		.then(function(response) {
			if (!response.ok) {
				var msg = util.format(
					"Failed to fetch barrier data.  status=%s, requestHeaders=%j, responseHeaders=%j",
					response.status,
					requestHeaders,
					response.headers
				);
				debug(msg);
				var err = new Error('Barrier API Call Failed');
				var errData = {extra:{requestHeaders:requestHeaders,responseHeaders:response.headers}};
				ravenClient.captureError(err,errData);
			}
			return response;
		})
		.then(fetchres.json);
}

module.exports = {
	getBarrierData : getBarrierData
};
