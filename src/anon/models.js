'use strict';

function AnonymousModel(req){
	this.userIsAnonymous = ((req.get('X-FT-Anonymous-User') || '').toLowerCase() === 'true');
}

function FirstClickFreeModel(){
	this.signInLink = 'https://next.ft.com/login';
	this.subscribeNowLink = 'https://sub.ft.com/spa_5/';
}

module.exports = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};
