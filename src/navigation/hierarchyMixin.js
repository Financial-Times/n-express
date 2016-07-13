"use strict";
const Poller = require('ft-poller');
const ms = require('ms');

function clone(obj){
	return JSON.parse(JSON.stringify(obj));
}

function findItem(data, id, parent){
	for(let item of data){
		if(item.id === id){
			return {
				item: item,
				parent: parent
			}
		}

		if(item.children){
			let result = findItem(item.children, id, item);
			if(result.item){
				return result;
			}
		}
	}

	return {item:null, parent:null};
}

module.exports = class HierarchyMixin {

	constructor(){
		this.poller = new Poller({
			url: 'http://next-navigation.ft.com/v1/taxonomy',
			refreshInterval: ms('15m')
		})
	}

	init(){
		return this.poller.start({initialRequest:true})
	}

	find(id){
		let data = this.poller.getData();
		return findItem(data, id);
	}

	ancestors(id){
		let item = this.find(id);
		let ancestors = [];
		while(item.parent){
			let parent = clone(item.parent);
			delete parent.children;
			ancestors.push(parent);
			item = this.find(parent.id);
		}

		return ancestors.reverse();
	}

	children(id){
		let result = this.find(id);
		return result.item && result.item.children ? result.item.children: [];
	}
};
