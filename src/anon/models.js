'use strict';

function AnonymousModel(req){
	this.userIsAnonymous = !(req.get('FT-Session-Token'));
}

function FirstClickFreeModel(){
	this.signInLink = 'https://next.ft.com/login';
	this.subscribeNowLink = 'https://sub.ft.com/spa_5/';
}

module.exports = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};
