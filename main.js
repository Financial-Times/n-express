/*jshint node:true*/
"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

var express = require('express');
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var expressHandlebars = require('express-handlebars');
var barriers = require('next-barrier-component');

var robots = require('./src/express/robots');
var normalizeName = require('./src/normalize-name');



var flagsPromise = flags.init();

// MA: Disgraceful hack to trick symlinks partials to work in not production as this relies on
// knowledge of implementation details that ft-next-express should not be privy to.
if (process.env.NODE_ENV !== 'production') {
	var actualExpressHandlebarsPrivateGetDir = expressHandlebars.ExpressHandlebars.prototype._getDir;
	expressHandlebars.ExpressHandlebars.prototype._getDir = function() {
		var actualExtname = this.extname;
		this.extname = "*/*" + actualExtname;
		var output = actualExpressHandlebarsPrivateGetDir.apply(this, arguments);
		this.extname = actualExtname;
		return output;
	};
}

module.exports = function(options) {
	options = options || {};
	var app = express();
	var name = options.name;
	var directory = options.directory || process.cwd();
	var helpers = options.helpers || {};
	if (!name) {
		try {
			var packageJson = require(directory + '/package.json');
			name = packageJson.name;
		} catch(e) {
			// Safely ignorable error
		}
	}
	if (!name) throw new Error("Please specify an application name");
	app.locals.__name = name = normalizeName(name);
	app.locals.__environment = process.env.NODE_ENV || '';
	app.locals.__isProduction = app.locals.__environment.toUpperCase() === 'PRODUCTION';
	app.locals.__rootDirectory = directory;

	helpers.paragraphs = require('./src/handlebars/paragraphs');
	helpers.removeImageTags = require('./src/handlebars/remove-image-tags');
	helpers.ifEquals = require('./src/handlebars/if-equals');
	helpers.ifAll = require('./src/handlebars/if-all');
	helpers.ifSome = require('./src/handlebars/if-some');
	helpers.topicUrl = require('./src/handlebars/topic-url');
	helpers.dateformat = require('./src/handlebars/dateformat');
	helpers.resize = require('./src/handlebars/resize');
	helpers.encode = require('./src/handlebars/encode');
	helpers.hashedAsset = require('./src/handlebars/hashed-asset');
	helpers.defineBlock = require('./src/handlebars/define-block');
	helpers.outputBlock = require('./src/handlebars/output-block');
	helpers.slice = require('./src/handlebars/slice');
	helpers.json = require('./src/handlebars/json');

	app.use('/' + name, express.static(directory + '/public', {
		setHeaders: function(res) {
			// TODO:MA Once we are generating new paths on every deploy (git hash?) then up the max-age to 'a long time'
			res.setHeader('Cache-Control', 'max-age=120, public, stale-while-revalidate=259200, stale-if-error=259200');
		}
	}));


	app.get('/robots.txt', robots);

	app.set('views', directory + '/views');
	app.engine('.html', expressHandlebars({
		extname: '.html',
		helpers: helpers,
		defaultLayout: false,
		layoutsDir: __dirname + '/layouts',
		partialsDir: [
			directory + '/views/partials',
			directory + '/bower_components',
			barriers.partialsDirectory
		]
	}));

	app.set('view engine', '.html');
	app.use(barriers.middleware);
	app.use(flags.middleware);

	var actualAppListen = app.listen;
	app.listen = function() {
		var args = arguments;
		app.use(errorsHandler.middleware);

		return flagsPromise.then(function() {
			actualAppListen.apply(app, args);
		});
	};

	return app;
};
