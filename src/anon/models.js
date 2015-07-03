'use strict';

function AnonymousModel(req){
	if(req.get('FT-Session-Token')){
		this.userIsLoggedIn = true;
		this.userIsAnonymous = false;
	}else{
		this.userIsLoggedIn = false;
		this.userIsAnonymous = true;
	}
}

function FirstClickFreeModel(){
	this.signInLink = '/login';
	this.subscribeNowLink = '/product-selector';
}

module.exports = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};
