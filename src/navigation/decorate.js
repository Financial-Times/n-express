"use strict";

function isCurrentLink(item, currentUrl){
	return (item.href && item.href === currentUrl) || (item.id && currentUrl.includes(item.id));
}

function decorateDrawerItem(item, currentUrl){
	if(item.children){
		let found = decorateDrawerItems(item.children, currentUrl);
		if(found){
			return true;
		}
	}

	if(item.item && isCurrentLink(item.item, currentUrl)){
		item.item.selected = true;
		return true;
	}

	return false;
}

function decorateDrawerItems(items, currentUrl){
	return items.some(item => decorateDrawerItem(item, currentUrl));
}

function decorateDrawer(items, currentUrl){
	items.some(section => decorateDrawerItems(section, currentUrl));
}

function decorateItem (item, currentUrl) {
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

module.exports = function decorate(items, listName, currentUrl) {
	switch (listName) {
		case "footer":
			return;
		case "drawer":
			return decorateDrawer(items, currentUrl);
		default:
			return decorateItems(items, currentUrl);
	}
};
