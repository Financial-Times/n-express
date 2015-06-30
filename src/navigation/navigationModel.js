'use strict';

function NavigationModel(flags, isAnon){
	this.myFT = !isAnon || flags.anonymousMyFt ? {} : null;
	this.myAccount = isAnon ? null : {};
	this.signIn = isAnon ? {} : null;
	this.signOut = !isAnon ? {} : null;
	this.subscribe = isAnon ? {} : null;
}

module.exports = NavigationModel;
