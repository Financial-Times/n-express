'use strict';
var anonModels = require('./models');
var NavigationModel = require('../navigation/navigationModel');

function anonymousMiddleware(req, res, next){
	res.locals.anon = new anonModels.AnonymousModel(req);
	res.locals.firstClickFreeModel =
		res.locals.anon.userIsAnonymous && res.locals.flags.firstClickFree ?
			new anonModels.FirstClickFreeModel() :
			null;
	res.locals.navigationModel = new NavigationModel(res.locals.flags, res.locals.anon.userIsAnonymous);
	next();
}

module.exports = anonymousMiddleware;
