'use strict';

const defaultWelcomeBannerModel = {
	name: 'default',
	title: 'Welcome to the new FT.com',
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

const compactViewWelcomeBannerModel = {
	name: 'compact-ad',
	title: 'Try the new compact homepage',
	strapline: 'A list view of today\'s homepage, with less images',
	ctas : {
		primary : {
			text: 'Try it now',
			href: '/viewtoggle/compact',
			trackable: 'compact-view'
		}
	}
};

function welcomeBannerModelFactory (req, res, next){
	var model;
	if(res.locals.flags.compactView && req.path === '/' && req.get('FT-Cookie-ft-homepage-view') !== 'compact'){
		model = compactViewWelcomeBannerModel;
	}else{
		model = defaultWelcomeBannerModel;
	}

	res.locals.welcomeBanner = model;
	next();
}

module.exports = welcomeBannerModelFactory;
module.exports._banners = {defaultWelcomeBannerModel, compactViewWelcomeBannerModel};
