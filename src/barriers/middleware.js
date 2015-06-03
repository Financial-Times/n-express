'use strict';
var debug = require('debug')('ft-next-barrier-component');
var BarriersModel = require('./models/barriers');
var barrierAPIClient = require('./barrierAPIClient');
var barrierTypes = require('./barrierTypes');


function fallbackBarrier(req, res){
	res.redirect('https://registration.ft.com/registration/barrier/login?location=http://next.ft.com' + req.url);
}

function middleware(req, res, next) {
	res.locals.barrier = false;
	res.locals.barriers = {};

	var authGateResult = req.get('X-FT-Auth-Gate-Result');
	var barrierType = req.get('X-FT-Barrier-Type');
	var userIsAnonymous = ((req.get('X-FT-Anonymous-User') || '').toLowerCase() === 'true');
	var countryCode = req.get('Country-Code');

	res.vary('X-FT-Anonymous-User, X-FT-Auth-Gate-Result, X-FT-Barrier-Type, Country-Code');
	res.set('Outbound-Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');

	if(authGateResult !== 'DENIED'){
		debug('Auth Gate Result is "%s" ,so no barrier to show', authGateResult);
		return next();
	}

	if(!res.locals.flags.barrier){
		return fallbackBarrier(req, res);
	}

	res.locals.barrier = (barrierType !== null);

	//todo remove this when we have a real barrier type from API
	if(userIsAnonymous && barrierType !== null){
		barrierType = barrierTypes.REGISTER_PLUS;
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

module.exports =  middleware;
