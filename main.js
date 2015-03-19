/*jshint node:true*/
"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

var express = require('express');
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var expressHandlebars = require('express-handlebars');
var handlebars = require('handlebars');
var barriers = require('next-barrier-component');
var metrics = require('next-metrics');

var robots = require('./src/express/robots');
var normalizeName = require('./src/normalize-name');

var serviceMatchers = {
	'capi-v1-article': /^https?:\/\/api\.ft\.com\/content\/items\/v1\/[\w\-]+/,
	'capi-v1-page': /^https?:\/\/api\.ft\.com\/site\/v1\/pages\/[\w\-]+/,
	'capi-v1-pages-list': /^https?:\/\/api\.ft\.com\/site\/v1\/pages/,
	'sapi': /^https?:\/\/api\.ft\.com\/content\/search\/v1/,
	'elastic-v1-article': /^https?:\/\/[\w\-]+\.foundcluster\.com:9243\/v1_api_v2\/item/,
	'user-prefs': /^https?:\/\/ft-next-api-user-prefs-v002\.herokuapp\.com/,
	'flags': /^https?:\/\/ft-next-api-feature-flags\.herokuapp\.com\/production/,
	// 'elastic-search':
	'capi-v2-article': /^https?:\/\/api\.ft\.com\/content\/[\w\-]+/,
	'capi-v2-enriched-article': /^https?:\/\/api\.ft\.com\/enrichedcontent\/[\w\-]+/
};

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
	helpers.usePartial = require('./src/handlebars/use-partial');
	helpers.flagStatuses = require('./src/handlebars/flag-statuses');

	app.use('/' + name, express.static(directory + '/public', {
		setHeaders: function(res) {
			// TODO:MA Once we are generating new paths on every deploy (git hash?) then up the max-age to 'a long time'
			res.setHeader('Cache-Control', 'max-age=120, public, stale-while-revalidate=259200, stale-if-error=259200');
		}
	}));

	app.get('/robots.txt', robots);

	app.set('views', directory + '/views');

	var expressHandlebarsInstance = new expressHandlebars.ExpressHandlebars({
		// use a handlebars instance we have direct access to so we can expose partials
		handlebars: handlebars,
		extname: '.html',
		helpers: helpers,
		defaultLayout: false,
		layoutsDir: __dirname + '/layouts',
		partialsDir: [
			directory + '/views/partials',
			directory + '/bower_components',
			barriers.partialsDirectory
		]
	});

	// makes the usePartial helper possible
	var exposePartials = expressHandlebarsInstance.getPartials().then(function(partials) {
		handlebars.partials = partials;
		// express handlebars does a poor job of making the helpers available everywhere, so we do it manually
		handlebars.registerHelper(helpers);
	});

	app.engine('.html', expressHandlebarsInstance.engine);

	app.set('view engine', '.html');

	metrics.init({ app: name, flushEvery: 40000 });
	app.use(function(req, res, next) {
		metrics.instrument(req, { as: 'express.http.req' });
		metrics.instrument(res, { as: 'express.http.res' });
		next();
	});
	if (options.serviceDependencies) {
		Object.keys(options.serviceDependencies).forEach(function (serv) {
			serviceMatchers[serv] = options.serviceDependencies[serv];
		});
	}
	metrics.fetch.instrument({
		serviceMatchers: serviceMatchers,
		onUninstrumented: function (url, opts) {
			errorsHandler.captureMessage('Service ' + url + ' called but no metrics set up. See next-express README for details');
		}
	});

	app.use(barriers.middleware);
	flags.setUrl('http://ft-next-api-feature-flags.herokuapp.com/production');
	var flagsPromise = flags.init();
	app.use(flags.middleware);

	var actualAppListen = app.listen;

	app.listen = function() {
		var args = arguments;
		app.use(errorsHandler.middleware);

		return Promise.all([flagsPromise, exposePartials]).then(function() {
			metrics.count('express.start');
			actualAppListen.apply(app, args);
		});
	};

	return app;
};
