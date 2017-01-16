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

module.exports = appName => {

	return (req, res, next) => {
		// TODO - change how all this works in order to use __assets/app/{appname}
		// allow static assets through
		if (req.path.indexOf('/' + appName) === 0 ||
			// allow healthchecks etc. through
			req.path.indexOf('/__') === 0) {
			next();
		} else if (
			backendKeys.indexOf(req.get('FT-Next-Backend-Key')) > -1 ||
			backendKeys.indexOf(req.get('FT-Next-Backend-Key-Old')) > -1
		) {
			res.set('FT-Backend-Authentication', true);
			next();
		} else {
			res.set('FT-Backend-Authentication', false);
			if (process.env.NODE_ENV === 'production') {
				// NOTE - setting the status text is very important as it's used by the CDN
				// to trigger stale-if-error if we mess up the key synchronisation again
				res.status(401).send('Invalid Backend Key');
			} else {
				next();
			}
		}
	};
};
