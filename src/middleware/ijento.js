'use strict';

const frontPageConf = {
	uuid: null,
	classification: null,
	type: 'Page',
	sitemap: 'Sections.Front page'
};

const defaultConf = {
	uuid: null,
	classification: null,
	type: 'Page',
	sitemap: null
};

// Default ijento config. Overridden for specific pages (notably articles)
module.exports = function (req, res, next) {
	if (res.locals.flags.analytics) {
		res.locals.ijentoConfig = /^\/(uk|international)/.test(req.path) ? frontPageConf : defaultConf;
	}
	next();
};
