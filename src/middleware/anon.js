const logger = require('@dotcom-reliability-kit/logger');

/**
 * @import {Callback, Request, Response} from '../../typings/n-express'
 */

/**
 * @param {Request} req
 */
function AnonymousModel (req) {
	if (req.get('FT-Anonymous-User') === 'true') {
		this.userIsLoggedIn = false;
		this.userIsAnonymous = true;
		this.userIsSubscribed = false;
	} else {
		this.userIsLoggedIn = true;
		this.userIsAnonymous = false;
		// set by subscription task in preflight
		this.userIsSubscribed = getSubscriptionStatus(req) === 'subscribed';
	}
}

/**
 * @param {Request} req
 */
function getSubscriptionStatus (req) {
	// e.g.: status=subscribed;productCodes=P2,MPR;licenceIds=00000000-0000-0000-0000-000000000000;access=isB2c,isStaff
	const userSubscriptionHeader = req.get('ft-user-subscription');
	// e.g.: subscribed
	const userSubscriptionStatusHeader = req.get('ft-user-subscription-status');

	// We expect this header to always be set,
	// since the CDN adds a default value if not present
	// https://github.com/Financial-Times/ft.com-cdn/blob/3ef5c860e390fe882e51a2a63134566cf53b4112/src/vcl/next-preflight.vcl#L67
	if (!userSubscriptionHeader) {
		logger.warn({
			event: 'SUBSCRIPTION_HEADER_MISSING',
			message: 'The ft-user-subscription header was not received'
		});

		return userSubscriptionStatusHeader;
	}

	const userSubscriptionProperties = userSubscriptionHeader.split(';');

	const userSubscriptionStatus = userSubscriptionProperties
		.map(property => property.split('='))
		.find(([key, value]) => key === 'status' && value)?.[1];

	// A mismatch here suggests an issue with the Preflight subscription task.
	// This can happen if:
	// - The task is disabled
	// - One or more of its downstream services failed
	if ((userSubscriptionStatusHeader === 'subscribed' || userSubscriptionStatusHeader === 'registered') && userSubscriptionStatus === 'anonymous') {
		logger.warn({
			event: 'SUBSCRIPTION_HEADER_STATUS_MISMATCH',
			message: `The value of the ft-user-subscription header status ${userSubscriptionStatus} does not match the value of the ft-user-subscription-status header ${userSubscriptionStatusHeader}`
		});

		return userSubscriptionStatusHeader;
	}

	return userSubscriptionStatus;
}

function FirstClickFreeModel () {
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
function showFirstClickFree (req, res) {
	return (
		res.locals.flags.firstClickFree &&
		req.get('FT-Access-Decision') === 'GRANTED' &&
		req.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY'
	);
}

/**
 * @type {Callback}
 */
function anonymousMiddleware (req, res, next) {
	// Skip for static assets, healthchecks, etc.
	// These routes shouldn't need the anonymous status
	if (req.path.indexOf('/__') === 0) {
		return next();
	}

	// Skip for POST, PUT requests
	// These routes skip preflight
	// https://github.com/Financial-Times/ft.com-cdn/blob/327f373f99c88490d54f8fc7e899e03a2fbc7c10/src/vcl/next-preflight.vcl#L99-L102
	if (req.method === 'POST' || req.method === 'PUT') {
		return next();
	}

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
