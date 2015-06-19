'use strict';
var hardCodedBarrierData = require('./hardCodedBarrierData');

function TrialGridBarrierModel(json) {
	this.signInLink = '/login';
	this.packages = new Packages(json.viewData.subscriptionOptions);
	this.otherOptions = new OtherOptions();
}

function Packages(json) {
	this.trial = json.TRIAL ? new Package(json.TRIAL) : null;
	this.standard = json.STANDARD ? new Package(json.STANDARD): null;
	this.premium = json.STANDARD ? new Package(json.PREMIUM) : null;
	this.newspaper = json.NEWSPAPER ? new Package(json.NEWSPAPER) : null;
}

function Package(json) {
	this.name = json.trackingOffer.productName;
	this.type = json.type;
	this.price = new PackagePrice(json.price);
	this.details = new PackageDetails(json);
	this.subscribeLink = json.callToActionUrl;
}

function PackagePrice(json, isTrial) {
	this.weekly = json.weekly.symbol + json.weekly.value;
	this.monthly = json.monthly.symbol + json.monthly.value;
	this.annual = json.annual.symbol + json.annual.value;
	if(isTrial){
		this.trialPrice = this.monthly;
		this.afterTrialPrice = this.weekly;
	}
}

function PackageDetails(json) {
	this.title = '';
	this.items = [
		{description : ''}
	];
}

function Option(){
	this.link = '';
}

function OtherOptions(){
	this.corporate = new Option();
	this.newspaper = new Option();
	this.ePaper = new Option();
	this.weekendAppEdition = new Option();
}
module.exports = function factory(json){
	return hardCodedBarrierData(new TrialGridBarrierModel(json));
};
