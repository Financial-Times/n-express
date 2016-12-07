const handlebars = require('@financial-times/n-handlebars');
const hashedAssets = require('../lib/hashed-assets');
const Poller = require('ft-poller');

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
		viewsDirectory: options.viewsDirectory,
		cache: true
	})
		.then(instance => {
			new Poller({
				url: 'http://ft-next-n-ui-prod.s3-website-eu-west-1.amazonaws.com/n-ui/layouts/wrapper-precompiled.js',
				interval: 5000,
				parseData: tpl => {
					console.log('got new tpl')
					tpl = tpl.replace('</body>', `<div style="background: white;position: absolute;top: 0;left:0;color:red;font-size:50px">${Date.now()}</div></body>`)
					const tplAsObj = eval(tpl);
					instance.compiled[typeof options.layoutsDir !== 'undefined' ? options.layoutsDir : (directory + '/bower_components/n-ui/layout') + '/wrapper.html']
						= instance.handlebars.compile(tplAsObj);
				}
			})

		});
}
