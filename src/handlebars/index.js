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
		const linkedAssets = [];
		res.link = (file, meta) => {
			meta = meta || {};
			const header = [];
			header.push(`<${hashedAssetUtils.getPath(file)}>`);
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
				res.link(`main${cssVariant ? '-' + cssVariant : ''}.css`, {
					as: 'style'
				});
				res.link('main.js', {
					as: 'script'
				});
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
