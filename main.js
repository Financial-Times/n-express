/*jshint node:true*/
"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

var express = require('express');
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var handlebars = require('ft-next-handlebars');
var navigation = require('ft-next-navigation');
var metrics = require('next-metrics');
var robots = require('./src/express/robots');
var normalizeName = require('./src/normalize-name');
var anon = require('./src/anon');
var serviceMetrics = require('./src/service-metrics');

module.exports = function(options) {
	options = options || {};

	var packageJson = {};

	var defaults = {
		withFlags: true,
		withHandlebars: true,
		withNavigation: true,
	};

	Object.keys(defaults).forEach(function (prop) {
		if (typeof options[prop] === 'undefined') {
			options[prop] = defaults[prop];
		}
	});

	var app = express();
	var name = options.name;
	var directory = options.directory || process.cwd();

	if (!name) {
		try {
			packageJson = require(directory + '/package.json');
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

	try {
		app.locals.__version = require(directory + '/public/__about.json').appVersion;
	} catch (e) {}

	if (!app.locals.__isProduction) {
		app.use('/' + name, express.static(directory + '/public'));
	}

	app.get('/robots.txt', robots);

	var handlebarsPromise = Promise.resolve();

	if (options.withHandlebars) {
		var helpers = options.helpers || {};
		if (options.withFlags) {
			helpers.flagStatuses = require('./src/handlebars/flag-statuses');
		}
		helpers.hashedAsset = require('./src/handlebars/hashed-asset');

		handlebarsPromise = handlebars(app, {
			partialsDir: [
				directory + '/views/partials'
			],
			defaultLayout: false,
			layoutsDir: options.layoutsDir || __dirname + '/layouts',
			helpers: helpers,
			directory: directory
		});
	}

	metrics.init({ app: name, flushEvery: 40000 });
	app.use(function(req, res, next) {
		metrics.instrument(req, { as: 'express.http.req' });
		metrics.instrument(res, { as: 'express.http.res' });
		next();
	});

	serviceMetrics.init(options.serviceDependencies);

	app.get('/' + name + '/__about', function(req, res) {
		res.set({ 'Cache-Control': 'no-cache' });
		res.sendFile(directory + '/public/__about.json');
	});

	var flagsPromise = Promise.resolve();

	if (options.withFlags) {
		flagsPromise = flags.init({ url: 'http://ft-next-feature-flags-prod.s3-website-eu-west-1.amazonaws.com/flags/__flags.json' });
		app.use(flags.middleware);
	}

	if (options.withHandlebars) {
		app.use(anon.middleware);
	}

	if (options.withNavigation) {
		app.use(navigation.middleware);
	}

	var actualAppListen = app.listen;

	app.listen = function() {
		var args = arguments;
		app.use(errorsHandler.middleware);

		return Promise.all([flagsPromise, handlebarsPromise]).then(function() {
			metrics.count('express.start');
			actualAppListen.apply(app, args);
		})
			.catch(function(err) {

				// Crash app if flags or handlebars fail
				setTimeout(function() {
					throw err;
				}, 0);
			});
	};

	return app;
};

module.exports.Router = express.Router;
module.exports.services = serviceMetrics.services;
module.exports.metrics = metrics;
