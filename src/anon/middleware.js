'use strict';
const anonModels = require('./models');

function showFirstClickFree(req, res){
	return res.locals.flags && res.locals.flags.firstClickFree &&
			req.get('FT-Access-Decision') === 'GRANTED' &&
			req.get('FT-Access-Decision-Policy') === 'PRIVILEGED_REFERER_POLICY';
}

function anonymousMiddleware(req, res, next){
	res.locals.anon = new anonModels.AnonymousModel(req);
	res.locals.firstClickFreeModel =
		showFirstClickFree(req, res) ?
			new anonModels.FirstClickFreeModel() :
			null;

	res.vary('FT-Anonymous-User');

	if (res.locals.flags.brexitDiscount && res.locals.flags.brexitDiscountType) {
		getBarrierData(req).then(function (response) {
			res.brexitOfferBasePrice = response.viewData.subscriptionOptions.STANDARD.price.weekly;
			next();
		});
	}
	else {
		next();
	}
}

function getBarrierData (req) {

	const headers = {
		'Content-Classification': req.query['ft-content-classification'] || req.get('FT-Content-Classification') || 'CONDITIONAL_STANDARD',
		'Country-Code': req.query['country-code'] || req.get('country-code') || 'GBR',
	};

	if (headers['Content-Classification'] === '-') {
		headers['Content-Classification'] = 'CONDITIONAL_STANDARD';
	}

	return fetch('https://barrier-app.memb.ft.com/memb/barrier/v1/barrier-data', { headers: headers, timeout: 2000 })
		.then(res => res.json())
}

module.exports = anonymousMiddleware;
