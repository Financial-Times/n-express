'use strict';

const defaultWelcomeBannerModel = {
	name: 'default',
	title: 'Welcome to the new FT.com.',
	strapline: 'The same global insight. Faster than ever before on all your devices.',
	ctas : {
		primary : {
			text: 'View tips',
			href: '/tour',
			trackable: 'tour-page',
			'component-attr': 'cta-take-tour'
		}
	}
};

const compactAdvertWelcomeBannerModel = {
	name: 'compact-ad',
	title: 'Try the new compact homepage.',
	strapline: 'A list view of today\'s homepage, with fewer images',
	ctas : {
		primary : {
			text: 'Try it now',
			href: '/viewtoggle/compact',
			trackable: 'viewtoggle | compact'
		}
	}
};

const compactViewWelcomeBannerModel = {
	name: 'compact-view',
	title: 'You\'ve enabled the compact homepage.',
	strapline: 'A list view of today\'s homepage, with fewer images',
	ctas : {
		primary : {
			text: 'Return to full view',
			href: '/viewtoggle/standard',
			trackable: 'viewtoggle | standard'
		}
	}
};

function welcomeBannerModelFactory (req, res, next){
	let model;
	if(res.locals.flags.compactView && req.path === '/' && req.get('FT-Cookie-ft-homepage-view') !== 'compact') {
		model = compactAdvertWelcomeBannerModel;
	}else if(res.locals.flags.compactView && req.path === '/' && req.get('FT-Cookie-ft-homepage-view') === 'compact'){
		model = compactViewWelcomeBannerModel;
	}else{
		model = defaultWelcomeBannerModel;
	}

	res.locals.welcomeBanner = model;
	next();
}

module.exports = welcomeBannerModelFactory;
module.exports._banners = {defaultWelcomeBannerModel, compactAdvertWelcomeBannerModel, compactViewWelcomeBannerModel};
