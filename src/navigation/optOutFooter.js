"use strict";

// this provides an opt-out link in the footer for the compulsory opt-in phase of Next
module.exports = function (items, currentUrl) {
	const optOutLink = {
		name: 'Old FT.com',
		href: `/opt-out-confirm?location=${encodeURIComponent(currentUrl)}`,
		trackableName: 'Old FT.com'
	};
	const supportBlock = items.find(i => {
		return i.title === 'Support';
	});
	if (supportBlock) {
		supportBlock.optOutLink = optOutLink;
	}
	return items;
}
