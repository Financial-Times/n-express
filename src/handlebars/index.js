const handlebars = require('@financial-times/n-handlebars');
const hashedAssets = require('../lib/hashed-assets');

module.exports = function (conf) {
	const app = conf.app;
	const directory = conf.directory;
	const options = conf.options;
	const helpers = options.helpers || {};
	const partialsDir = [
		directory + (options.viewsDirectory || '/views') + '/partials',
		directory + ('/node_modules/@financial-times')
	];

	helpers.hashedAsset = function(options) {
		return hashedAssets.get(options.fn(this));
	};

	if (options.partialsDirectory) {
		partialsDir.push(options.partialsDirectory);
	}

	return handlebars(app, {
		partialsDir,
		defaultLayout: false,
		// The most common use case, n-ui/layout is not bundled with this package
		layoutsDir: typeof options.layoutsDir !== 'undefined' ? options.layoutsDir : (directory + '/bower_components/n-ui/layout'),
		helpers: helpers,
		directory: directory,
		viewsDirectory: options.viewsDirectory
	})
}
