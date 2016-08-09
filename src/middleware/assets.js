'use strict';

const path = require('path');
const hashedAssets = require('../lib/hashed-assets');

let version = false;
let majorVersion;
let versionType = 'none';
let nUiConfig;

// Attempt to get information about which major and minor versions of n-ui are installed
try {
	version = require(path.join(process.cwd(), 'bower_components/n-ui/.bower.json')).version;

	if (/(beta|rc)/.test(version)) {
		versionType = 'beta';
	} else {
		versionType = 'semver';
		version = version.split(".").slice(0,2).join('.');
		majorVersion = version.split('.').slice(0,1)[0];
	}

} catch (e) {}

// Attempt to retrieve the json file used to configure n-ui
try {
	nUiConfig = Object.assign({}, require(path.join(process.cwd(), 'client/n-ui-config')), {preload: true})
} catch (e) {}


function constructLinkHeader (file, meta, opts) {
	meta = meta || {};
	opts = opts || {};
	const header = [];
	header.push(`<${opts.hashed ? hashedAssets.get(file) : file }>`);
	Object.keys(meta).forEach(key => {
		header.push(`${key}="${meta[key]}"`)
	});

	if (!meta.rel) {
		header.push('rel="preload"')
	}

	header.push('nopush');
	this.append('Link', header.join('; '))
}

module.exports = function (options) {
	return (req, res, next) => {

		// define a helper for adding a link header
		res.linkResource = constructLinkHeader;


		if (req.accepts('text/html')) {
			res.locals.javascriptBundles = [];
			res.locals.cssBundles = [];
			res.locals.inlineCss;

			// work out which assets will be required by the page
			if (res.locals.flags.nUiBundle && options.hasNUiBundle) {
				//backwards compatibility
				const nUiVersion = 'v' + ((versionType === 'semver' && res.locals.flags.nUiBundleMajorVersion) ? majorVersion : version);
				res.locals.nUiConfig = nUiConfig;
				res.locals.javascriptBundles.push(`//next-geebee.ft.com/n-ui/no-cache/${nUiVersion}/es5-core-js${res.locals.flags.nUiBundleUnminified ? '' : '.min'}.js`);
				res.locals.javascriptBundles.push(hashedAssets.get('main-without-n-ui.js'));
			} else {
				res.locals.javascriptBundles.push(hashedAssets.get('main.js'));
			}

			// output the default link headers just before rendering
			const originalRender = res.render;
			res.render = function (template, templateData) {

				const cssVariant = templateData.cssVariant || res.locals.cssVariant;
				res.locals.cssBundles = [
					{
						path: hashedAssets.get(`main${cssVariant ? '-' + cssVariant : ''}.css`),
						isMain: true
					}
				];
				res.locals.cssBundles.forEach(file => res.linkResource(file.path, {as: 'style'}));
				res.locals.javascriptBundles.forEach(file => res.linkResource(file, {as: 'script'}));
				return originalRender.apply(res, [].slice.call(arguments));
			}
		}

		next();
	}
}
