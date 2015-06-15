'use strict';
var debug = require('debug')('ft-next-barrier-component');
var BarriersModel = require('./models/barriers');
var barrierAPIClient = require('./barrierAPIClient');
var barrierTypes = require('./barrierTypes');
var fetchres = require('fetchres');

var metrics;

function middleware(req, res, next) {
	res.locals.barrier = false;
	res.locals.barriers = {};

	var accessDecision = req.get('FT-Access-Decision') || req.get('X-FT-Auth-Gate-Result');
	var barrierType = req.get('FT-Barrier-Type') || req.get('X-FT-Barrier-Type');
	var userIsAnonymous = ((req.get('FT-Anonymous-User') || req.get('X-FT-Anonymous-User') || '').toLowerCase() === 'true');
	var countryCode = req.get('Country-Code');

	debug('Barrier Middleware: accessDecision=%s barrierType=%s userIsAnonymous=%s countyCode=%s',
		accessDecision, barrierType, userIsAnonymous, countryCode
	);

	res.vary('X-FT-Anonymous-User, X-FT-Auth-Gate-Result, X-FT-Barrier-Type, Country-Code');
	res.set('Outbound-Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');

	if(accessDecision !== 'DENIED'){
		debug('Auth Gate Result is "%s" ,so no barrier to show', accessDecision);
		return next();
	}

	if(!res.locals.flags.barrier){
		res.locals.barrier = false;
		debug('Barrier Flag is off - site is currently free');
		metrics.count && metrics.count('barrier_flag_off', 1);
		return next();
	}

	res.locals.barrier = (barrierType !== null);

	//todo remove this when we have a real barrier type from API
	if(userIsAnonymous && barrierType !== null){
		barrierType = barrierTypes.TRIAL;
	}

	if(res.locals.flags.firstClickFree) {
		debug('First click free active, disable barrier');
		res.locals.barrier = false;
		return next();
	}

	debug('Show barrier barrierType=%s', barrierType);

	barrierAPIClient.getBarrierData(req)
		.then(function(json) {
			debug('Barrier data fetched');
			res.locals.barriers = new BarriersModel(barrierType, json, countryCode);
			next();
		}).catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				// failover to a free site when barriers call fails
				res.locals.barrier = false;
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
