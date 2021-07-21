/**
 * @typedef {import("../../typings/n-express").Callback} Callback
 * @typedef {import("../../typings/n-express").Request} Request
 * @typedef {import("../../typings/n-express").Response} Response
 */

/**
 * @type {Callback}
 */
function AnonymousModel(req) {
	if (req.get('FT-Anonymous-User') === 'true') {
		this.userIsLoggedIn = false;
		this.userIsAnonymous = true;
	} else {
		this.userIsLoggedIn = true;
		this.userIsAnonymous = false;
	}
}

function FirstClickFreeModel() {
	this.signInLink = '/login';
}

const anonModels = {
	AnonymousModel: AnonymousModel,
	FirstClickFreeModel: FirstClickFreeModel
};

/**
 * @param {Request} req
 * @param {Response} res
 */
function showFirstClickFree(req, res) {
	return (
		res.locals.flags.firstClickFree &&
		req.get('FT-Access-Decision') === 'GRANTED' &&
		req.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY'
	);
}

/**
 * @type {Callback}
 */
function anonymousMiddleware(req, res, next) {
	res.locals.anon = new anonModels.AnonymousModel(req);
	res.locals.firstClickFreeModel = showFirstClickFree(req, res)
		? new anonModels.FirstClickFreeModel()
		: null;

	res.vary('FT-Anonymous-User');
	next();
}

module.exports = {
	middleware: anonymousMiddleware
};
