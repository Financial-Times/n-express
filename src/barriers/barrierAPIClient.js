'use strict';
/*global fetch*/
require('isomorphic-fetch');
var debug = require('debug')('ft-next-barrier-component');
var util = require('util');
var fetchres = require('fetchres');
var ravenClient = require('express-errors-handler');

var endpoints = {
	test : 'http://barrier-app-test.apps.memb.ft.com/memb/barrier/v1/barrier-data',
	prodDirect : 'https://barrier-app.memb.ft.com/memb/barrier/v1/barrier-data',
	prod : 'https://subscribe.ft.com/memb/barrier/v1/barrier-data'
};

function getRequestHeaders(req){
	return {
		"Session-Id": req.get('FT-Session-Token') || req.get('X-FT-Session-Token'),
		"Country-Code": req.get('Country-Code') || 'GBR',
		"Content-Classification": req.get('FT-Content-Classification') || req.get('X-FT-Content-Classification'),
		"AYSC": req.get('FT-Cookie-AYSC') || req.get('X-FT-AYSC')
	};
}

function getBarrierData(requestHeaders){
	debug('Barriers API request url=%s headers=%j', endpoints.prod, requestHeaders);
	return fetch(endpoints.prodDirect, { headers: requestHeaders })
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

function getBarrierDataFromRequest(req){
	return getBarrierData(getRequestHeaders(req));
}

module.exports = {
	getBarrierDataFromRequest : getBarrierDataFromRequest,
	getBarrierData : getBarrierData
};
