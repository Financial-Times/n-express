'use strict';
var models = require('./models');

function anonymousMiddleware(req, res, next){
	res.locals.anon = new models.AnonymousModel(req);
	res.locals.firstClickFreeModel =
		res.locals.anon.userIsAnonymous && res.locals.flags.firstClickFree ?
			new models.FirstClickFreeModel() :
			null;
	next();
}

module.exports = anonymousMiddleware;
