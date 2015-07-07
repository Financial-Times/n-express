'use strict';

function AnonymousModel(req){
	this.userIsAnonymous = !(req.get('FT-Session-Token') || req.get('X-FT-Session-Token'));
}

function FirstClickFreeModel(){
	this.signInLink = 'https://next.ft.com/login';
	this.subscribeNowLink = 'https://sub.ft.com/spa_5/?segID=400872&segmentID=676c655f-9b47-27a8-97db-ab3a6a6dbc54';
}

module.exports = {
	AnonymousModel : AnonymousModel,
	FirstClickFreeModel : FirstClickFreeModel
};
