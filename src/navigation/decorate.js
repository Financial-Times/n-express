"use strict";

function isCurrentLink(item, currentUrl){
	return (item.href && item.href === currentUrl) || (item.id && currentUrl.includes(item.id));
}

function decorateDrawerItem(item,  currentUrl){
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

function decorateItem(item, currentUrl){
	if(item.children){
		if(decorateItemArray(item.children, currentUrl)){
			return true;
		}
	}

	if(isCurrentLink(item, currentUrl)){
		item.selected = true;
		return true;
	}

	return false;
}

function decorateItemArray(items, currentUrl){
	items.some(item => decorateItem(item, currentUrl));
}

module.exports = function decorate(items, listName, currentUrl){
	switch(listName){
		case "footer":
		case "account":
		case "navbar_right":
			return;
		case "drawer":
			return decorateDrawer(items, currentUrl);
		default:
			return decorateItemArray(items, currentUrl);
	}
};
