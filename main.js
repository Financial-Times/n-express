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
var sensu = require('./src/sensu');
var normalizeName = require('./src/normalize-name');
var anon = require('./src/anon');
var serviceMetrics = require('./src/service-metrics');
var dependencies = require('./src/dependencies');

module.exports = function(options) {
	options = options || {};

	var packageJson = {};

	var defaults = {
		withFlags: true,
		withHandlebars: true,
		withNavigation: true,
		withBackendAuthentication: true,
		sensuChecks: [],
		healthChecks: []
	};

	Object.keys(defaults).forEach(function (prop) {
		if (typeof options[prop] === 'undefined') {
			options[prop] = defaults[prop];
		}
	});

	var app = express();
	var name = options.name;
	var description = "";
	var directory = options.directory || process.cwd();

	if (!name) {
		try {
			packageJson = require(directory + '/package.json');
			name = packageJson.name;
			description = packageJson.description || "";
		} catch(e) {
			// Safely ignorable error
		}
	}

	if (!name) throw new Error("Please specify an application name");
	app.locals.__name = name = normalizeName(name);
	app.locals.__environment = process.env.NODE_ENV || '';
	app.locals.__isProduction = app.locals.__environment.toUpperCase() === 'PRODUCTION';
	app.locals.__rootDirectory = directory;
	var sensuChecks = sensu(name, options.sensuChecks);
	var healthChecks = options.healthChecks;

	try {
		app.locals.__version = require(directory + '/public/__about.json').appVersion;
	} catch (e) {}

	// Only allow authorized upstream applications access
	if (options.withBackendAuthentication) {
		app.use(function (req, res, next) {
			// allow static assets through
			if (req.path.indexOf('/' + name) === 0 ||
				// allow healthchecks etc. through
				req.path.indexOf('/__') === 0) {
				next();
			} else if (req.get('FT-Next-Backend-Key') === process.env.FT_NEXT_BACKEND_KEY) {
				res.set('FT-Backend-Authentication', true);
				next();
			} else {
				res.set('FT-Backend-Authentication', false);
				if (process.env.NODE_ENV === 'production') {
					res.sendStatus(401);
				} else {
					next();
				}
			}
		});
	}

	if (!app.locals.__isProduction) {
		app.use('/' + name, express.static(directory + '/public'));
	}

	app.get('/robots.txt', robots);
	app.get('/__sensu', function(req, res) {
		res.set({ 'Cache-Control': 'max-age=60' });
		res.json(sensuChecks);
	});

	app.get('/__health', function(req, res) {
		res.set({ 'Cache-Control': 'no-store' });
		var checks = healthChecks.map(function(check) {
			return check.getStatus();
		});
		if (checks.length === 0) {
			checks.push({
				name: 'App has no healthchecks',
				ok: false,
				severity: 3,
				businessImpact: 'If this application encounters any problems, nobody will be alerted and it probably will not get fixed.',
				technicalSummary: 'This app has no healthchecks set up',
				panicGuide: 'Don\'t Panic'
			});
		}
		res.json({
			schemaVersion: 1,
			name: app.locals.__name,
			description: description,
			checks: checks
		});
	});

	app.get('/__dependencies', dependencies(app.locals.__name));

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

	app.get('/__about', function(req, res) {
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
