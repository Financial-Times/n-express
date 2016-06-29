'use strict';

const backendKeys = [];
if (process.env.FT_NEXT_BACKEND_KEY) {
	backendKeys.push(process.env.FT_NEXT_BACKEND_KEY);
}
if (process.env.FT_NEXT_BACKEND_KEY_OLD) {
	backendKeys.push(process.env.FT_NEXT_BACKEND_KEY_OLD);
}
if (process.env.FT_NEXT_BACKEND_KEY_OLDEST) {
	backendKeys.push(process.env.FT_NEXT_BACKEND_KEY_OLDEST);
}

module.exports = function (appName) {

	return function (req, res, next) {
		// allow static assets through
		if (req.path.indexOf('/' + appName) === 0 ||
			// allow healthchecks etc. through
			req.path.indexOf('/__') === 0) {
			next();
		} else if (backendKeys.indexOf(req.get('FT-Next-Backend-Key')) !== -1) {
			res.set('FT-Backend-Authentication', true);
			next();
		} else {
			res.set('FT-Backend-Authentication', false);
			if (process.env.NODE_ENV === 'production') {
				res.sendStatus(401);
			} else {
				next();
			}
		}
	};
};
