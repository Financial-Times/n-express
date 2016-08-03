'use strict';
const Poller = require('ft-poller');
const ms = require('ms');
const url = require('url');
const decorateSelectedLink = require('./decorate');
const HierarchyMixin = require('./hierarchyMixin');

function clone(obj){
	return JSON.parse(JSON.stringify(obj));
}

module.exports = class NavigationModel {

	constructor(options){
		this.options = Object.assign({}, {withNavigationHierarchy:false}, options || {});
		this.poller = new Poller({
			url: 'http://next-navigation.ft.com/v1/lists',
			refreshInterval: ms('15m')
		});
		if(this.options.withNavigationHierarchy){
			this.hierarchy = new HierarchyMixin();
		}

	}

	init(){
		let promises = [
			this.poller.start({initialRequest:true})
		];
		if(this.options.withNavigationHierarchy){
			promises.push(this.hierarchy.init());
		}

		return Promise.all(promises);
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

	static showMobileNav(currentUrl, navData){
		const currentPathName = url.parse(currentUrl).pathname;
		for(let item of navData){
			if(currentPathName === item.href || (item.id && currentUrl.includes(item.id))){
				return true;
			}
		}

		return false;
	}

	middleware(req, res, next){
		let currentEdition = res.locals.editions.current.id;
		res.locals.navigation = {
			lists: {}
		};
		res.locals.navigationLists = {};

		const currentUrl = req.get('ft-blocked-url') || req.get('FT-Vanity-Url') || req.url;
		let data = this.poller.getData();
		if(!data){
			next();
			return;
		}

		for(let listName of Object.keys(data)){

			// not really a list
			// tood: remove meganav from data returned by api
			if(listName === 'meganav'){
				continue;
			}

			// mobile nav only on homepage
			if(listName === 'navbar_mobile' && !NavigationModel.showMobileNav(currentUrl, data[listName][currentEdition])){
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

		// take the actual path rather than a vanity
		if (this.options.withNavigationHierarchy && /^\/stream\//.test(req.path)) {
			const regexResult = /stream\/(.+)Id\/(.+)/i.exec(req.path);
			if(regexResult && regexResult.length === 3){
				let id = regexResult[2];
				res.locals.navigation.currentItem = this.hierarchy.find(id).item;
				res.locals.navigation.ancestors = this.hierarchy.ancestors(id);
				res.locals.navigation.children = this.hierarchy.children(id);
			}
		}

		next();
	}
};
