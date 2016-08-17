'use strict';

const path = require('path');
const fs = require('fs');
const hashedAssets = require('../lib/hashed-assets');

let nUiSpecificVersion = false;
let nUiMajorVersion;
let versionType = 'none';
let nUiConfig;

// Attempt to get information about which major and minor versions of n-ui are installed
try {
	nUiSpecificVersion = require(path.join(process.cwd(), 'bower_components/n-ui/.bower.json')).version;

	if (/(beta|rc)/.test(nUiSpecificVersion)) {
		versionType = 'beta';
	} else {
		versionType = 'semver';
		nUiSpecificVersion = nUiSpecificVersion.split(".").slice(0,2).join('.');
		nUiMajorVersion = nUiSpecificVersion.split('.').slice(0,1)[0];
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

module.exports = function (options, directory) {

	const headCsses = options.hasHeadCss ? fs.readdirSync(`${directory}/public`)
		.filter(name => /^head[\-a-z]*\.css$/.test(name))
		.map(name => [name, fs.readFileSync(`${directory}/public/${name}`, 'utf-8')])
		.reduce((currentHeadCsses, currentHeadCss) => {
			currentHeadCsses[currentHeadCss[0].replace('.css', '')] = currentHeadCss[1];
			return currentHeadCsses;
		}, {}) : {};

	return (req, res, next) => {

		// define a helper for adding a link header
		res.linkResource = constructLinkHeader;

		// backwards compatible - can remove once n-ui templates updated everywhere
		res.locals.headCsses = headCsses;
		if (req.accepts('text/html')) {
			res.locals.javascriptBundles = [];
			res.locals.cssBundles = [];
			res.locals.criticalCss = [];

			// work out which assets will be required by the page
			if (res.locals.flags.nUiBundle && options.hasNUiBundle) {
				//backwards compatibility
				const nUiActiveVersion = 'v' + ((versionType === 'semver' && res.locals.flags.nUiBundleMajorVersion) ? nUiMajorVersion : nUiSpecificVersion);
				res.locals.nUiConfig = nUiConfig;
				res.locals.javascriptBundles.push(`\
//next-geebee.ft.com/n-ui/no-cache/${nUiActiveVersion}/\
es5-${res.locals.flags.polyfillSymbol ? 'polyfill-io' : 'core-js'}\
${res.locals.flags.nUiBundleUnminified ? '' : '.min'}.js`);
				res.locals.javascriptBundles.push(hashedAssets.get('main-without-n-ui.js'));
			} else {
				res.locals.javascriptBundles.push(hashedAssets.get('main.js'));
			}

			// output the default link headers just before rendering
			const originalRender = res.render;
			res.render = function (template, templateData) {

				let cssVariant = templateData.cssVariant || res.locals.cssVariant;
				cssVariant = cssVariant ? '-' + cssVariant : '';

				// define which css to output in the critical path
				if (options.hasHeadCss) {
					if ((`head${cssVariant}-n-ui-core`) in headCsses) {
						res.locals.criticalCss.push(headCsses[`head${cssVariant}-n-ui-core`])
					}
					res.locals.criticalCss.push(headCsses[`head${cssVariant}`]);
				}

				res.locals.cssBundles = [
					{
						path: hashedAssets.get(`main${cssVariant}.css`),
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
