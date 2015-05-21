'use strict';

function AnonymousModel(req, flags){
	this.userIsAnonymous = ((req.get('X-FT-Anonymous-User') || '').toLowerCase() === 'true');
	this.firstClickFreeModel =
		this.userIsAnonymous && flags.firstClickFree ?
			new FirstClickFreeModel() :
			null;
}

function FirstClickFreeModel(){
	this.signInLink = 'https://next.ft.com/login';
	this.subscribeNowLink = 'https://sub.ft.com/spa_5/';
}

module.exports = AnonymousModel;
