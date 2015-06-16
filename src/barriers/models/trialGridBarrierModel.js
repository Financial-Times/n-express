'use strict';
const hardCodedBarrierData = require('./hardCodedBarrierData');

class TrialGridBarrierModel {

	constructor(json) {
		this.signInLink = '/login';
		this.packages = new Packages(json.viewData.subscriptionOptions);
	}

}

class Packages {

	constructor(json) {
		this.trial = new Package(json.TRIAL);
		this.standard = new Package(json.STANDARD);
		this.premium = new Package(json.PREMIUM);
		this.newspaper = new Package(json.NEWSPAPER);
	}
}

class Package {

	constructor(json) {
		this.name = json.trackingOffer.productName;
		this.type = json.type;
		this.price = new PackagePrice(json.price);
		this.details = new PackageDetails(json);
		this.subscribeLink = json.callToActionUrl;
	}
}

class PackagePrice {

	constructor(json,isTrial) {
		this.weekly = json.weekly.symbol + json.weekly.value;
		this.monthly = json.monthly.symbol + json.monthly.value;
		this.annual = json.annual.symbol + json.annual.value;
		if(isTrial){
			this.trialPrice = this.monthly;
			this.afterTrialPrice = this.weekly;
		}
	}
}

class PackageDetails {

	constructor(json) {
		this.title = '';
		this.items = [
			{description : ''}
		]
	}
}


module.exports = function factory(json){
	return hardCodedBarrierData(new TrialGridBarrierModel(json));
};
