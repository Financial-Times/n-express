'use strict';
var anonModels = require('./models');
var NavigationModel = require('../navigation/navigationModel');

function showFirstClickFree(req, res){
	return res.locals.flags && res.locals.flags.firstClickFree &&
			req.get('FT-Access-Decision') === 'GRANTED' &&
			req.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY';
}

function anonymousMiddleware(req, res, next){
	res.locals.anon = new anonModels.AnonymousModel(req);
	res.locals.firstClickFreeModel =
		showFirstClickFree(req, res) ?
			new anonModels.FirstClickFreeModel() :
			null;
	const currentUrl = req.get('ft-blocked-url')
		|| req.get('FT-Vanity-Url')
		|| req.url;
	res.locals.navigationModel = new NavigationModel(res.locals.flags, res.locals.anon.userIsAnonymous, currentUrl);
	res.vary('FT-Anonymous-User');
	next();
}

module.exports = anonymousMiddleware;
