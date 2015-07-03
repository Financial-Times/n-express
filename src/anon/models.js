'use strict';

function AnonymousModel(req){
	this.userIsAnonymous = !(req.get('FT-Session-Token') || req.get('X-FT-Session-Token'));
	this.userIsLoggedIn = !this.userIsAnonymous;
}

function FirstClickFreeModel(){
	this.signInLink = '/login';
	this.subscribeNowLink = '/product-selector';
}

module.exports = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};
