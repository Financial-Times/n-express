/**
 * @import {Callback} from '../../typings/n-express'
 */

/**
 * @type {Callback}
 */
const consent = (req, res, next) => {
	res.locals = res.locals || {};
	res.locals.consent = res.locals.consent || {};

	const consent = req.get('ft-consent');
	if (consent && consent !== '-') {
		// parse consent preferences from preflight header:
		// ft-consent=marketingByemail:on,recommendedcontentOnsite:off
		// becomes
		// res.locals.consent = {
		// 	marketingByemail: true,
		// 	recommendedcontentOnsite: false
		// }
		const consentPreferences = consent.split(',');
		consentPreferences.forEach((consentFlag) => {
			const [key, state] = consentFlag.split(':');
			if (key && state) {
				res.locals.consent[key] = state === 'on';
			}
		});
	}
	next();
};

module.exports = consent;
