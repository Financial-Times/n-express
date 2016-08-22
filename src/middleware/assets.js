'use strict';

const path = require('path');
const fs = require('fs');
const hashedAssets = require('../lib/hashed-assets');
const semver = require('semver');

let versions = [];


// Attempt to get information about which major and minor versions of n-ui are installed
try {
	const nUiRelease = require(path.join(process.cwd(), 'bower_components/n-ui/.bower.json'))._release;

	if (!semver.valid(nUiRelease)) {
		versions = [nUiRelease, nUiRelease];
	}	else if (/(beta|rc)/.test(nUiRelease)) {
		versions = ['v' + nUiRelease, 'v' + nUiRelease];
	} else {
		versions = [
			'v' + nUiRelease.split('.').slice(0,2).join('.'),
			'v' + nUiRelease.split('.').slice(0,1).join('.')
		]
	}

	if (/(beta|rc)/.test(nUiSpecificVersion)) {
		versionType = 'beta';
	} else {
		versionType = 'semver';
		nUiSpecificVersion = nUiSpecificVersion.split(".").slice(0,2).join('.');
		nUiMajorVersion = nUiSpecificVersion.split('.').slice(0,1)[0];
	}

} catch (e) {}

const nUiSpecificVersion = versions[0];
const nUiMajorVersion = versions[1];

// Attempt to retrieve the json file used to configure n-ui
let nUiConfig;
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
		const swCriticalCss = req.get('ft-next-sw') && res.locals.flags.swCriticalCss;
		// define a helper for adding a link header
		res.linkResource = constructLinkHeader;

		// backwards compatible - can remove once n-ui templates updated everywhere
		res.locals.headCsses = headCsses;
		if (req.accepts('text/html')) {
			res.locals.javascriptBundles = [];
			res.locals.cssBundles = [];
			res.locals.criticalCss = [];

			const nUiActiveVersion = res.locals.flags.nUiBundleMajorVersion ? nUiMajorVersion : nUiSpecificVersion;
			// work out which assets will be required by the page
			if (res.locals.flags.nUiBundle && options.hasNUiBundle) {
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
						if (swCriticalCss) {
							res.locals.cssBundles.push({
								path: `//next-geebee.ft.com/n-ui/no-cache/${nUiActiveVersion}/main.css`
							});
						} else {
							// even if the page hasn't been loaded via sw, we still want to encourage the browser to preload
							// this shared critical css file for the next visit. Support for prefetch is wider than for preload too
							if (res.locals.flags.swCriticalCss) {
								res.linkResource(`//next-geebee.ft.com/n-ui/no-cache/${nUiActiveVersion}/main.css`, {as: 'style', rel: 'prefetch'});
							}
							res.locals.criticalCss.push(headCsses[`head${cssVariant}-n-ui-core`])
						}
					}
					res.locals.criticalCss.push(headCsses[`head${cssVariant}`]);
				}

				res.locals.cssBundles.push({
					path: hashedAssets.get(`main${cssVariant}.css`),
					isMain: true,
					isLazy: true
				});

				res.locals.cssBundles.forEach(file => res.linkResource(file.path, {as: 'style'}));
				res.locals.javascriptBundles.forEach(file => res.linkResource(file, {as: 'script'}));
				return originalRender.apply(res, [].slice.call(arguments));
			}
		}

		next();
	}
}
