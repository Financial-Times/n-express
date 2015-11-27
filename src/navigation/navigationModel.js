'use strict';

function NavigationModel(flags, isAnon){
	this.myFT = {};
	this.myAccount = isAnon ? null : {};
	this.signIn = isAnon ? {} : null;
	this.signOut = !isAnon ? {} : null;
	this.subscribe = isAnon ? {} : null;
}

module.exports = NavigationModel;
