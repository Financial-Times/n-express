"use strict";
const url = require('url');

function isCurrentLink(item, currentUrl){
	const currentPathName = url.parse(currentUrl).pathname;
	return (item.href && item.href === currentPathName) || (item.id && currentUrl.includes(item.id));
}

function decorateItem (item, currentUrl) {
	item = item.item || item;

	if (Array.isArray(item)) {
		return decorateItems.apply(null, Array.prototype.slice.call(arguments, 0));
	}

	if (item.children) {
		decorateItems(item.children, currentUrl);
	}

	if (isCurrentLink(item, currentUrl)) {
		item.selected = true;
	}

	if (item.href && item.href.includes('${currentPath}')) {
		item.href = item.href.replace('${currentPath}', encodeURIComponent(currentUrl));
	}
}

function decorateItems(items, currentUrl){
	const mapFunc = item => decorateItem(item, currentUrl);

	if (Array.isArray(items)) {
		items.forEach(mapFunc);
	} else {
		Object.keys(items).forEach(key => mapFunc(items[key]));
	}
}

module.exports = function decorate(items, currentUrl) {
	return decorateItems(items, currentUrl);
};
