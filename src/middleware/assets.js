'use strict';

const path = require('path');
const fs = require('fs');
const hashedAssets = require('../lib/hashed-assets');
const semver = require('semver');
const nPolyfillIo = require('@financial-times/n-polyfill-io');

function hasLinkedNUi (directory) {
	const stat = fs.lstatSync(path.join(directory, './bower_components/n-ui'));
	return stat.isSymbolicLink();
}

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

	let versionUrls = [];

	// Attempt to get information about which major and minor versionUrls of n-ui are installed
	try {

		if (hasLinkedNUi(directory)) {
			console.warn(`
/*********** n-ui warning ************/

It looks like you're bower linking n-ui.
Be sure to also \`make run\` in your n-ui directory

/*********** n-ui warning ************/
`);
			versionUrls = [
				'//local.ft.com:3456/',
				'//local.ft.com:3456/'
			];
		} else {
			const nUiRelease = require(path.join(directory, 'bower_components/n-ui/.bower.json'))._release;
			if (!semver.valid(nUiRelease)) {
				versionUrls = [nUiRelease, nUiRelease];
			}	else if (/(beta|rc)/.test(nUiRelease)) {
				versionUrls = ['v' + nUiRelease, 'v' + nUiRelease];
			} else {
				versionUrls = [
					'v' + nUiRelease.split('.').slice(0,2).join('.'),
					'v' + nUiRelease.split('.').slice(0,1).join('.')
				]
			}
			versionUrls = versionUrls.map(v => `//next-geebee.ft.com/n-ui/no-cache/${v}/`)
		}

	} catch (e) {}
	const nUiSpecificVersionUrlRoot = versionUrls[0];
	const nUiMajorVersionUrlRoot = versionUrls[1];

	// Attempt to retrieve the json file used to configure n-ui
	let nUiConfig;
	try {
		nUiConfig = Object.assign({}, require(path.join(directory, 'client/n-ui-config')), {preload: true})
	} catch (e) {}


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

			const nUiUrlRoot = res.locals.flags.nUiBundleMajorVersion ? nUiMajorVersionUrlRoot : nUiSpecificVersionUrlRoot;
			// work out which assets will be required by the page
			if (res.locals.flags.nUiBundle && options.hasNUiBundle) {
				res.locals.nUiConfig = nUiConfig;
				res.locals.javascriptBundles.push(`\
${nUiUrlRoot}\
es5-${res.locals.flags.polyfillSymbol ? 'polyfill-io' : 'core-js'}\
${res.locals.flags.nUiBundleUnminified ? '' : '.min'}.js`);
				res.locals.javascriptBundles.push(hashedAssets.get('main-without-n-ui.js'));
			} else {
				res.locals.javascriptBundles.push(hashedAssets.get('main.js'));
			}

			// output the default link headers just before rendering
			const originalRender = res.render;
			const polyfillHost = res.locals.flags.polyfillQA ? 'qa.polyfill.io' : 'next-geebee.ft.com/polyfill';

			res.locals.polyfillCallbackName = 'ftNextPolyfillServiceCallback';
			res.locals.polyfillUrls = {
				enhanced: nPolyfillIo({
					host: polyfillHost,
					type: 'enhanced',
					qs: {
						callback: res.locals.polyfillCallbackName,
						rum: res.locals.flags.polyfillsRUM ? 1 : 0,
						excludes: res.locals.flags.polyfillSymbol ? [] : ['Symbol', 'Symbol.iterator', 'Symbol.species', 'Map', 'Set']
					}
				}),
				core: nPolyfillIo({
					host: polyfillHost,
					type: 'core'
				})
			}

			res.locals.javascriptBundles.push(res.locals.polyfillUrls.enhanced);

			res.render = function (template, templateData) {

				let cssVariant = templateData.cssVariant || res.locals.cssVariant;
				cssVariant = cssVariant ? '-' + cssVariant : '';

				// define which css to output in the critical path
				if (options.hasHeadCss) {
					if ((`head${cssVariant}-n-ui-core`) in headCsses) {
						if (swCriticalCss) {
							res.locals.cssBundles.push({
								path: `${nUiUrlRoot}main.css`
							});
						} else {
							// even if the page hasn't been loaded via sw, we still want to encourage the browser to preload
							// this shared critical css file for the next visit. Support for prefetch is wider than for preload too
							if (res.locals.flags.swCriticalCss) {
								res.linkResource(`${nUiUrlRoot}main.css`, {as: 'style', rel: 'prefetch'});
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
