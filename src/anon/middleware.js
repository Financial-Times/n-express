'use strict';
var AnonymousModel = require('./anonymousModel');

function anonymousMiddleware(req, res, next){
	res.locals.anon = new AnonymousModel(req, res.locals.flags);
	next();
}

module.exports = anonymousMiddleware;
