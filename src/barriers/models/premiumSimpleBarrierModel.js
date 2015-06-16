'use strict';
var util = require('util');

function PremiumBarrierModel(json, countryCode) {
	this.signInLink = null;
	this.subscribeNowLink = json.viewData.subscriptionOptions.PREMIUM.callToActionUrl + '&countryCode=' + countryCode;
}

module.exports = PremiumBarrierModel;
