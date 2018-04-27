module.exports = (req, res, next) => {
	res.locals = res.locals || {};
	res.locals.consent = res.locals.consent || {};

	const consent = req.get('ft-consent');
	if(consent && consent !== '-') {
		// parse consent preferences from preflight header:
		// ft-consent=marketingByemail:on,recommendedcontentOnsite:off
		// becomes
		// res.locals.consent = {
		// 	marketingByemail: true,
		// 	recommendedcontentOnsite: false
		// }
		const consentPreferences = consent.split(',');
		consentPreferences.array.forEach(consentFlag => {
			const [ key, state ] = consentFlag.split(':');
			res.locals.consent[key] = state === 'on';
		});
	}
	next();
};
