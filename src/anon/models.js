'use strict';

function AnonymousModel(req){
	if(req.get('FT-User-UUID')){
		this.userIsLoggedIn = true;
		this.userIsAnonymous = false;
	}else{
		this.userIsLoggedIn = false;
		this.userIsAnonymous = true;
	}
}

function FirstClickFreeModel(){
	this.signInLink = '/login';
	this.subscribeNowLink = '/product-selector?segID=400872&segmentID=676c655f-9b47-27a8-97db-ab3a6a6dbc54';
}

module.exports = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};
