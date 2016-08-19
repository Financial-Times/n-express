'use strict';
const anonModels = require('./models');

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

	res.vary('FT-Anonymous-User');
	next();
}

module.exports = anonymousMiddleware;
