'use strict';
var util = require('util');
var barrierTypes = require('../barrierTypes').barriers;
var PremiumSimpleBarrierModel = require('./premiumSimpleBarrierModel');
var TrialSimpleBarrierModel = require('./trialSimpleBarrierModel');
var trialGridBarrierModelFactory = require('./trialGridBarrierModel');

function BarriersModel(type, json, countryCode){
	this.type = type;
	this.premiumSimple = null;
	this.trialSimple = null;
	this.trialGrid = null;

	if(type === barrierTypes.PREMIUM_SIMPLE){
		this.premiumSimple = new PremiumSimpleBarrierModel(json, countryCode);
	}

	if(type === barrierTypes.TRIAL_SIMPLE){
		this.trialSimple = new TrialSimpleBarrierModel(json);
	}

	if(type === barrierTypes.TRIAL_GRID){
		this.trialGrid = trialGridBarrierModelFactory(json);
	}
}




module.exports = BarriersModel;
