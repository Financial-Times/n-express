'use strict';
const Poller = require('ft-poller');
const ms = require('ms');
const decorateSelectedLink = require('./decorate');

function clone(obj){
	return JSON.parse(JSON.stringify(obj));
}

module.exports = class NavigationModel {

	constructor(){
		this.poller = new Poller({
			url: 'http://next-navigation.ft.com/v1/lists',
			refreshInterval: ms('15m')
		});
	}

	init(){
		return this.poller.start({initialRequest:true})
	}

	list(name){
		let data = this.poller.getData();
		if(!data){
			throw new Error('No lists data loaded');
		}

		if(!data[name]){
			throw new Error(`No list with name '${name}' found`);
		}

		return clone(data[name]);
	}

	middleware(req, res, next){
		let currentEdition = req.get('FT-Edition') || 'uk';
		res.locals.navigation = {
			lists: {}
		};
		res.locals.navigationLists = {};

		// remove query string just in case
		let currentUrl = req.path.replace(/\?.+$/, '');
		for(let listName of Object.keys(this.poller.getData())){

			// not really a list
			// tood: remove meganav from data returned by api
			if(listName === 'meganav'){
				continue;
			}

			let listData = this.list(listName);

			// List data could be an object with arrays for each edition, or just an array if the same for every edition
			if(!Array.isArray(listData)){
				listData = listData[currentEdition] || listData;
			}

			decorateSelectedLink(listData, listName, currentUrl);
			res.locals.navigation.lists[listName] = listData;

			// I think the form above is better as it keeps things in a "navigation" namespace
			// keeping this for legacy support
			// todo: remove this when it's no longer useds
			res.locals.navigationLists[listName] = listData;
		}

		next();
	}
};


