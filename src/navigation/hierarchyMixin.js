"use strict";
const Poller = require('ft-poller');
const ms = require('ms');
const log = require('@financial-times/n-logger').default;

const API_URL = 'http://next-navigation.ft.com/v1/taxonomy';
const FALLBACK_URL = 'http://ft-next-navigation.s3-website-eu-west-1.amazonaws.com/json/taxonomy.json';

function clone(obj){
	return JSON.parse(JSON.stringify(obj));
}

function findItem(data, id, parent){
	if(!data){
		return {item:null, parent:null};
	}

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
			url: API_URL,
			refreshInterval: ms('15m')
		})
	}

	init(){
		return this.poller.start({initialRequest:true})
			.catch(err => {
				log.error({event:'NAVIGATION_API_DOWN', error:err.message});
				return this.fallback();
			});
	}

	fallback(){
		return fetch(FALLBACK_URL)
			.then(response => {
				if(!response.ok){
					log.error({event:'S3_FALLBACK_FAIL', url:FALLBACK_URL, status:response.status});
					return null;
				}else{
					log.info({event:'NAVIGATION_HIERARCHY_USING_S3_BUCKET'});
					return response.json();
				}

			})
			.then(data => {
				this.fallbackData = data;
			})
			.catch(err => {
				log.error({event:'S3_FALLBACK_FAIL', url:FALLBACK_URL, error:err.message, stack:err.stack.replace(/\n/g, '; ')});
				this.fallbackData = null;
			})
	}

	find(id){
		let data = this.poller.getData() || this.fallbackData;
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
