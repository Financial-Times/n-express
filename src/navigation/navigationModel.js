'use strict';

function NavigationModel(flags, isAnon, location){
	this.myFT = {};
	this.myAccount = isAnon ? null : {};
	this.signIn = isAnon ? {} : null;
	this.signInUrl = '/login';
	if (location) {
		this.signInUrl += `?location=${encodeURIComponent(location)}`;
	}
	this.signOut = !isAnon ? {} : null;
	this.subscribe = isAnon ? {} : null;
	this.subscribeUrl = '/products?segID=400863&segmentID=190b4443-dc03-bd53-e79b-b4b6fbd04e64';
}

module.exports = NavigationModel;
