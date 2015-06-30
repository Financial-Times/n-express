'use strict';
/* jshint ignore:start */
var Symbol = require('es6-symbol');
/* jshint ignore:end */
var getBarrierType = require('./barrierTypes');
var debug = require('debug')('ft-next-barrier-component');
var log = require('ft-next-splunk-logger')('ft-next-barrier-component');
var BarriersModel = require('./models/barriersModel');
var barrierAPIClient = require('./barrierAPIClient');
var fetchres = require('fetchres');
var errorClient = require('express-errors-handler');
var beacon = require('next-beacon-node-client');
var url = require('url');



var metrics;

function logBarrierShow(barrier, userIsAnonymous, sessionToken){
	log('BARRIER_DISPLAYED. We just showed the %s barrier to a user.  barrier=%s anonymous=%s session=%s', barrier, barrier, userIsAnonymous, sessionToken);
}

function makeBeaconRequest(req, sessionToken, type, barrierType){
	var data =  {
		meta: {
			type: type
		},
		user: {
			flags: req.get('FT-Flags') || req.get('X-Flags'),
			sessionToken : sessionToken
		},
		page: {
			location: {
				pathname: req.path,
				hostname: 'next.ft.com'
			},
			referrer: url.parse(req.get('Referrer') || '')
		}
	};

	if(barrierType){
		data.meta.barrierType = barrierType;
	}
	beacon.fire('barrier', data);
}

function middleware(req, res, next) {
	res.locals.barrier = null;
	res.locals.barriers = {};

	var accessDecision = req.get('FT-Access-Decision') || req.get('X-FT-Auth-Gate-Result');
	var barrierType = getBarrierType(req.get('FT-Barrier-Type') || req.get('X-FT-Barrier-Type'), res.locals.flags);
	var userIsAnonymous = ((req.get('FT-Anonymous-User') || req.get('X-FT-Anonymous-User') || '').toLowerCase() === 'true');
	var countryCode = req.get('Country-Code');
	var sessionToken = req.get('FT-Session-Token') || req.get('X-FT-Session-Token');

	var fireBeacon = makeBeaconRequest.bind(null, req, sessionToken);

	debug('Barrier Middleware: accessDecision=%s barrierType=%s userIsAnonymous=%s countyCode=%s url=%s',
		accessDecision, barrierType, userIsAnonymous, countryCode, req.url
	);

	res.vary('X-FT-Anonymous-User, X-FT-Auth-Gate-Result, X-FT-Barrier-Type, Country-Code');
	res.set('Outbound-Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');

	if(accessDecision !== 'DENIED'){
		debug('Auth Gate Result is "%s" ,so no barrier to show', accessDecision);
		res.locals.barrier = false;
		return next();
	}

	if(!res.locals.flags.barrier){
		res.locals.barrier = false;
		debug('Barrier Flag is off - site is currently free');
		metrics.count && metrics.count('barrier_flag_off', 1);
		fireBeacon('disabled');
		return next();
	}

	res.locals.barrier = null;

	if(res.locals.flags.firstClickFree) {
		debug('First click free active, disable barrier');
		fireBeacon('firstClickFree');
		return next();
	}

	debug('Show barrier barrierType=%s url=%s', Symbol.keyFor(barrierType), req.url);


	barrierAPIClient.getBarrierDataFromRequest(req)
		.then(function(json) {
			debug('Barrier data fetched');
			debug(json);
			debug('Build view model for barrier %s', Symbol.keyFor(barrierType));
			try{
				res.locals.barrier = new BarriersModel(barrierType, json, countryCode);
				logBarrierShow(barrierType, userIsAnonymous, sessionToken);
			}catch(err){
				res.locals.barrier = null;
				debug('Failed to parse json');
				fireBeacon('failover');
				errorClient.captureError(err, {extra: {request: barrierAPIClient.getBarrierRequestHeaders(req), barrierAPIData: json, path: req.path}});
			}

			fireBeacon('shown', barrierType);
			next();
		}).catch(function(err) {
			if (err.name === fetchres.BadServerResponseError.name) {
				// failover to a free site when barriers call fails
				fireBeacon('failover');
				next();
			} else {
				next(err);
			}
		});
}

module.exports =  function(m){
	metrics = m;
	return middleware;
};
