const logger = require('@dotcom-reliability-kit/logger');

/**
 * @import {Callback, Request, Response} from '../../typings/n-express'
 */

/**
 * @param {string} header
 */
function parseSubscriptionHeader (header) {
	const headerProperties = header.split(';');

	/**
	 * If we don't receive the header, we assume the user is anonymous with no access.
	 * @type {{
	 * status: 'subscribed' | 'registered' | 'anonymous'
	 * productCodes?: string[]
	 * licenceIds?: string[]
	 * access: { isB2b: boolean, isB2c: boolean, isStaff: boolean }
	 * }} */
	const subscriptionDetails = {
		status: 'anonymous',
		productCodes: [],
		licenceIds: [],
		access: {
			isB2b: false,
			isB2c: false,
			isStaff: false
		}
	};

	if (headerProperties.length === 0) {
		logger.warn({
			event: 'SUBSCRIPTION_HEADER_MISSING',
			message: 'The ft-user-subscription header was not received.'
		});

		return subscriptionDetails;
	}

	const statusList = new Set(['subscribed', 'registered', 'anonymous']);

	headerProperties.forEach((property) => {
		const [key, value] = property.split('=').map((s) => s.trim());

		if (!value) return;

		if (
			(key === 'productCodes' || key === 'licenceIds')
		) {
			subscriptionDetails[key] = value.split(',');
		}

		if (key === 'status' && statusList.has(value)) {
			subscriptionDetails.status =
				/** @type {'subscribed' | 'registered' | 'anonymous'} */
				(value);
		}

		if (key === 'access') {
			value.split(',').forEach((flag) => {
				if (flag in subscriptionDetails.access) {
					subscriptionDetails.access[
						/** @type {'isB2b' | 'isB2c' | 'isStaff'} */ (flag)
					] = true;
				}
			});
		}
	});

	return subscriptionDetails;
}

/**
 * @type {Callback}
 */
function subscriptionDetailsMiddleware (req, res, next) {
	res.locals.subscription = parseSubscriptionHeader(
		req.get('ft-user-subscription') || ''
	);

	next();
}

module.exports = {
	middleware: subscriptionDetailsMiddleware
};
