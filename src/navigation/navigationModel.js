'use strict';

function NavigationModel(flags, isAnon){
	this.myFT = !isAnon || flags.anonymousMyFt ? {} : null;
	this.myAccount = isAnon ? null : {};
	this.signIn = {};
}

module.exports = NavigationModel;
