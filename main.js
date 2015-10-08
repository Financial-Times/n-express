/*jshint node:true*/
"use strict";

require('isomorphic-fetch');

var express = require('express');
var csp = require('express-csp');
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var handlebars = require('@financial-times/n-handlebars');
var navigation = require('ft-next-navigation');
var metrics = require('next-metrics');
var nextLogger = require('ft-next-logger');
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
		withAnonMiddleware: true,
		withBackendAuthentication: true,
		withContentSecurityPolicy: true,
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

	// set up the logger
	nextLogger.addConsole(process.env.NODE_ENV === 'test' ? 'error' : 'info');
	if (process.env.NODE_ENV === 'production' && process.env.SPLUNK_URL) {
		nextLogger.addSplunk(process.env.SPLUNK_URL);
	}

	app.locals.__name = name = normalizeName(name);
	app.locals.__environment = process.env.NODE_ENV || '';
	app.locals.__isProduction = app.locals.__environment.toUpperCase() === 'PRODUCTION';
	app.locals.__rootDirectory = directory;
	var sensuChecks = sensu(name, options.sensuChecks);
	var healthChecks = options.healthChecks;

	// Note: Only *report* CSP violations.
	// The aim is to know which scripts are being executed via third-parties.
	if (options.withContentSecurityPolicy) {
		csp.extend(app, {
			reportPolicy: {
				directives: {
					'report-uri': ['/__csp-reports'],
					'default-src': [
						'unsafe-inline',
						'unsafe-eval',
						'self',
						'*.ft.com',
						'*.fyre.co',
						'*.livefyre.com'
					]
				}
			}
		});

		// Log CSP violation reports to splunk via nextLogger
		app.get('/__csp-reports', function(req) {
			if(app.locals.__isProduction) {
				nextLogger.logger.warn(JSON.stringify(req.body));
			}
		});
	}

	//Remove x-powered-by header
	app.set('x-powered-by', false);

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

	app.get('/__brew-coffee', function(req, res) {
		res.sendStatus(418);
	});

	app.get(/\/__health(?:\.([123]))?$/, function(req, res) {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
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
				panicGuide: 'Don\'t Panic',
				lastUpdated: new Date()
			});
		}
		if (req.params[0]) {
			checks.forEach(function(check) {
				if (check.severity <= Number(req.params[0]) && check.ok === false) {
					res.status(500);
				}
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
		helpers.hashedAsset = require('./src/handlebars/hashed-asset');

		handlebarsPromise = handlebars(app, {
			partialsDir: [
				directory + '/views/partials'
			],
			defaultLayout: false,
			// The most common use case, n-layout is not bundled with tis package
			layoutsDir: typeof options.layoutsDir !== 'undefined' ? options.layoutsDir : (directory + '/bower_components/n-layout/templates'),
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

	if (options.serviceDependencies) {
		var errMessage = 'next-express: options.serviceDependencies is deprecated. \n Please add any missing services you need to https://github.com/Financial-Times/next-express/blob/master/src/service-metrics.js';
		if (process.env.NODE_ENV !== 'production') {
			throw new Error(errMessage);
		} else {
			console.warn(errMessage);
		}
	}
	serviceMetrics.init(options.serviceDependencies);

	app.get('/__about', function(req, res) {
		res.set({ 'Cache-Control': 'no-cache' });
		res.sendFile(directory + '/public/__about.json');
	});

	var flagsPromise = Promise.resolve();

	var flagsEndpoints = [
		'http://next-flags.ft.com/',
		'http://ft-next-feature-flags-prod-us.s3-website-us-east-1.amazonaws.com/flags/__flags.json',
		'http://ft-next-feature-flags-prod.s3-website-eu-west-1.amazonaws.com/flags/__flags.json'
	];

	if (options.withFlags) {
		flagsPromise = flags.init({ urls : flagsEndpoints });
		app.use(flags.middleware);
	}

	if (options.withAnonMiddleware) {
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
module.exports.static = express.static;
module.exports.services = serviceMetrics.services;
module.exports.metrics = metrics;
module.exports.logger = nextLogger.logger;
