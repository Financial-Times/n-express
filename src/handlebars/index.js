const concatHelper = require('./concat');
const handlebars = require('@financial-times/n-handlebars');
const hashedAsset = require('./hashed-asset');

module.exports = function (conf) {
	const app = conf.app;
	const directory = conf.directory;
	const options = conf.options;
	const helpers = options.helpers || {};
	const hashedAssetUtils = hashedAsset(app.locals);

	helpers.hashedAsset = hashedAssetUtils.helper;
	helpers.concat = concatHelper;

	app.use((req, res, next) => {
		const originalRender = res.render;

		res.linkResource = (file, meta, opts) => {
			meta = meta || {};
			opts = opts || {};
			const header = [];
			header.push(`<${opts.hashed ? hashedAssetUtils.getPath(file) : file }>`);
			Object.keys(meta).forEach(key => {
				header.push(`${key}="${meta[key]}"`)
			});

			if (!meta.rel) {
				header.push('rel="preload"')
			}

			header.push('nopush');
			res.append('Link', header.join('; '))
		}

		res.render = function (template, templateData) {
			if (req.accepts('text/html')) {
				const cssVariant = templateData.cssVariant || res.locals.cssVariant;
				res.linkResource(`main${cssVariant ? '-' + cssVariant : ''}.css`, {
					as: 'style'
				}, {hashed: true});
				if (res.locals.nUiVersion) {
					res.linkResource('main-without-n-ui.js', {
						as: 'script'
					}, {hashed: true});
					res.linkResource(`//next-geebee.ft.com/n-ui/no-cache/${res.locals.nUiVersion}/es5-core-js${res.locals.flags.nUiBundleUnminified ? '.min' : ''}.js`, {
						as: 'script'
					});
				} else {
					res.linkResource('main.js', {
						as: 'script'
					}, {hashed: true});
				}

			}
			return originalRender.apply(res, [].slice.call(arguments));
		}
		next();
	})

	return handlebars(app, {
		partialsDir: [
			directory + (options.viewsDirectory || '/views') + '/partials'
		],
		defaultLayout: false,
		// The most common use case, n-ui/layout is not bundled with this package
		layoutsDir: typeof options.layoutsDir !== 'undefined' ? options.layoutsDir : (directory + '/bower_components/n-ui/layout'),
		helpers: helpers,
		directory: directory,
		viewsDirectory: options.viewsDirectory
	});
}
