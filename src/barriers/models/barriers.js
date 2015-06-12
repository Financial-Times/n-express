'use strict';
var util = require('util');
var barrierTypes = require('../barrierTypes');

//todo Will need to add more data into these models to allow for richer barriers

function BarriersModel(type, json, countryCode){
	if(type === barrierTypes.PREMIUM){
		this.premiumBarrier = new PremiumBarrierModel(json, countryCode);
	}

	if(type === barrierTypes.TRIAL){
		this.anonymousBarrier = new TrialBarrierModel(json);
	}
}

function TrialBarrierModel(){
	this.signInLink = 'https://next.ft.com/login';
	this.subscribeNowLink = 'https://sub.ft.com/spa_5/';
}

function PremiumBarrierModel(json, countryCode){
	this.signInLink = null;
	this.subscribeNowLink = util.format('https://subscription.ft.com/?offerId=%s&countryCode=%s', json.premiumOfferId, countryCode);
}

module.exports = BarriersModel;
