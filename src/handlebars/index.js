const handlebars = require('@financial-times/n-handlebars');
const hashedAssets = require('../lib/hashed-assets');
const Poller = require('ft-poller');
const fs = require('fs');
const vm = require('vm');

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

	// always enable in-memory view caching
	// - needed in prod to allow poling for layout updates
	// - in dev most changes result in the app restarting anyway, so in memory caching shouldn't impair development
	app.enable('view cache');

	const layoutsDir = typeof options.layoutsDir !== 'undefined' ? options.layoutsDir : (directory + '/bower_components/n-ui/layout')

	return handlebars(app, {
		partialsDir,
		defaultLayout: false,
		// The most common use case, n-ui/layout is not bundled with this package
		layoutsDir: layoutsDir,
		helpers: helpers,
		directory: directory,
		viewsDirectory: options.viewsDirectory
	})
		.then(instance => {
			if (process.env.N_UI !== 'linked') {
				new Poller({
					url: 'http://ft-next-n-ui-prod.s3-website-eu-west-1.amazonaws.com/n-ui/layouts/wrapper-precompiled.js',
					refreshInterval: 60000,
					parseData: tpl => {

						tpl = tpl
							.replace('</body>', `<div style=\\"background: white;position: absolute;top: 0;left:0;color:red;font-size:50px\\">${Date.now()}</div></body>`)

						const script = new vm.Script('(' + tpl + ')');
					  const tplAsObj = script.runInNewContext();

						instance.compiled[layoutsDir + '/wrapper.html'] = instance.handlebars.template(tplAsObj);
					},
					autostart: true
				})
			}
			return instance;
		});
}
