/* eslint strict: 0 */
'use strict';

const logger = require('@financial-times/n-logger').default;
const denodeify = require('denodeify');
const path = require('path');
const fs = require('fs');
const readFile = denodeify(fs.readFile);
const hashedAssets = require('../lib/hashed-assets');
const semver = require('semver');
const nPolyfillIo = require('@financial-times/n-polyfill-io');
const chokidar = require('chokidar');

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

	let nUiUrlRoot;
	const localAppShell = process.env.NEXT_APP_SHELL === 'local';
	// Attempt to get information about which version of n-ui is installed
	try {
		if (localAppShell) {
			logger.warn(`
/*********** n-express warning ************/

You have set the environment variable NEXT_APP_SHELL=local
This should only be used if you are actively developing
n-ui/n-html-app within the context of an app (by bower linking
or similar). It will slow down your build A LOT and be a slightly
less accurate approximation of the production app!!!!

If you do not need this behaviour run

			unset NEXT_APP_SHELL

/*********** n-express warning ************/
`);
			nUiUrlRoot = hashedAssets.get('n-ui/');
		} else {
			const nUiRelease = require(path.join(directory, 'bower_components/n-ui/.bower.json'))._release;
			if (!semver.valid(nUiRelease)) {
				// for non semver releases, use the tag in its entirety
				nUiUrlRoot = nUiRelease;
			}	else if (/(beta|rc)/.test(nUiRelease)) {
				// for beta releases, prepend a v
				nUiUrlRoot = 'v' + nUiRelease;
			} else {
				// for normal semver releases prepend a v to the major version
				nUiUrlRoot = 'v' + nUiRelease.split('.').slice(0,1)[0]
			}
			nUiUrlRoot = `//www.ft.com/__assets/n-ui/cached/${nUiUrlRoot}/`;
		}

	} catch (e) {}
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

	if (process.NODE_ENV !== 'production') {
		const paths = Object.keys(headCsses).map(css => `${directory}/public/${css}.css`);
		chokidar.watch(paths)
			.on('change', (path) => {
				readFile(path, 'utf-8').then((content) => {
					const name = path.match(/\/(head.*).css$/)[1];
					headCsses[name] = content;
					logger.info(`Reloaded head CSS: ${name}`);
				});
			})
			.on('unlink', (path) => {
				const name = path.match(/\/(head.*).css$/)[1];
				delete headCsses[name];
				logger.info(`Deleted head CSS: ${name}`);
				logger.warn('Please note you will need to restart app if you add new head CSS files');
			});
	}

	return (req, res, next) => {
		// This middleware relies on the presence of res.locals.flags.
		// In some scenarios (e.g. using handlebars but not flags) this
		// won't be present
		res.locals.flags = res.locals.flags || {};

		const swCriticalCss = req.get('ft-next-sw') && res.locals.flags.swCriticalCss;
		// define a helper for adding a link header
		res.linkResource = constructLinkHeader;

		// backwards compatible - can remove once n-ui templates updated everywhere
		res.locals.headCsses = headCsses;
		if (req.accepts('text/html')) {
			res.locals.javascriptBundles = [];
			res.locals.cssBundles = [];
			res.locals.criticalCss = [];

			// work out which assets will be required by the page
			if (options.hasNUiBundle) {
				res.locals.nUiConfig = nUiConfig;
				res.locals.javascriptBundles.push(
					`${nUiUrlRoot}es5${(res.locals.flags.nUiBundleUnminified || localAppShell ) ? '' : '.min'}.js`
				);
				res.locals.javascriptBundles.push(hashedAssets.get('main-without-n-ui.js'));
			}
			else {
				res.locals.javascriptBundles.push(hashedAssets.get('main.js'));
			}

			// output the default link headers just before rendering
			const originalRender = res.render;
			const polyfillRoot = `//${res.locals.flags.polyfillQA ? 'qa.polyfill.io' : 'next-geebee.ft.com/polyfill'}/v2/polyfill.min.js`;

			res.locals.polyfillCallbackName = nPolyfillIo.callbackName;
			res.locals.polyfillUrls = {
				enhanced: polyfillRoot + nPolyfillIo.getQueryString({
					enhanced: true,
					withRum: res.locals.flags.polyfillsRUM ? 1 : 0
				}),
				core: polyfillRoot + nPolyfillIo.getQueryString({
					enhanced: false
				})
			}

			res.locals.javascriptBundles.push(res.locals.polyfillUrls.enhanced);

			res.render = function (template, templateData) {

				let cssVariant = templateData.cssVariant || res.locals.cssVariant;
				cssVariant = cssVariant ? '-' + cssVariant : '';

				// define which css to output in the critical path
				if (options.hasHeadCss) {
					if (`head${cssVariant}-n-ui-core` in headCsses) {
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

				if (templateData.withAssetPrecache) {
					res.locals.cssBundles.forEach(file => res.linkResource(file.path, {as: 'style', rel: 'precache'}));
					res.locals.javascriptBundles.forEach(file => res.linkResource(file, {as: 'script', rel: 'precache'}));
				}

				return originalRender.apply(res, [].slice.call(arguments));
			}
		}

		next();
	}
}
