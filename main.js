/*jshint node:true*/
"use strict";

require('isomorphic-fetch');

const express = require('express');
const raven = require('@financial-times/n-raven');
const flags = require('next-feature-flags-client');
const handlebars = require('./src/handlebars');
const NavigationModel = require('./src/navigation/navigationModel');
const EditionsModel = require('./src/navigation/editionsModel');
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const robots = require('./src/express/robots');
const normalizeName = require('./src/normalize-name');
const anon = require('./src/anon');
const serviceMetrics = require('./src/service-metrics');
const vary = require('./src/middleware/vary');
const cache = require('./src/middleware/cache');
const builtAssets = require('./src/lib/built-assets');
const backendAuthentication = require('./src/middleware/backend-authentication');
const healthChecks = require('./src/lib/health-checks');

module.exports = function(options) {

	options = options || {};

	const defaults = {
		withFlags: false,
		withHandlebars: false,
		withNavigation: false,
		withNavigationHierarchy: false,
		withAnonMiddleware: false,
		withBackendAuthentication: false,
		withRequestTracing: false,
		hasHeadCss: false,
		hasNUiBundle: false,
		healthChecks: []
	};


	Object.keys(defaults).forEach(function (prop) {
		if (typeof options[prop] === 'undefined') {
			options[prop] = defaults[prop];
		}
	});

	let packageJson = {};
	let name = options.name;
	let description = '';
	let directory = options.directory || process.cwd();

	if (!name) {
		try {
			packageJson = require(directory + '/package.json');
			name = packageJson.name;
			description = packageJson.description || '';
		} catch(e) {
			// Safely ignorable error
		}
	}

	if (!name) throw new Error('Please specify an application name');

	const app = express();

	app.locals.__name = name = normalizeName(name);
	app.locals.__environment = process.env.NODE_ENV || '';
	app.locals.__isProduction = app.locals.__environment.toUpperCase() === 'PRODUCTION';
	app.locals.__rootDirectory = directory;

	//Remove x-powered-by header
	app.set('x-powered-by', false);

	try {
		app.locals.__version = require(directory + '/public/__about.json').appVersion;
	} catch (e) {}

	// 100% public end points
	if (!app.locals.__isProduction) {
		app.use('/' + name, express.static(directory + '/public', { redirect: false }));
	}

	app.get('/robots.txt', robots);
	app.get('/__brew-coffee', function(req, res) {
		res.sendStatus(418);
	});
	healthChecks(app, options, description);
	app.get('/__about', function(req, res) {
		res.set({ 'Cache-Control': 'no-cache' });
		res.sendFile(directory + '/public/__about.json');
	});

	// metrics should be one of the first things as needs to be applied before any other middleware executes
	metrics.init({ app: name, flushEvery: 40000 });
	app.use(function(req, res, next) {
		metrics.instrument(req, { as: 'express.http.req' });
		metrics.instrument(res, { as: 'express.http.res' });
		next();
	});

	// set the edition so it can be added to the html tag and used for tracking
	app.use(function(req, res, next) {
		const edition = req.get('ft-edition') || '';
		app.locals.__edition = edition;
		next();
	});

	serviceMetrics.init(options.serviceDependencies);


	// Only allow authorized upstream applications access
	if (options.withBackendAuthentication) {
		app.use(backendAuthentication(name));
	} else {
		nLogger.warn({ event: 'BACKEND_AUTHENTICATION_DISABLED', message: 'Backend authentication is disabled, this app is exposed directly to the internet' });
	}

	// utility middleware
	app.use(cache);
	app.use(vary);

	let initPromises = [];

	// feature flags
	if (options.withFlags) {
		initPromises.push(flags.init());
		app.use(flags.middleware);
	}

	// verification that expected assets exist and middleware to serve correctly
	// (Note - must run after feature flags)
	initPromises.push(builtAssets(app, options, directory, name));

	// templating
	if (options.withHandlebars) {
		initPromises.push(handlebars({
			app: app,
			directory: directory,
			options: options
		}));
	}

	// add statutory metadata to construct the page
	if (options.withNavigation) {
		const navigation = new NavigationModel({withNavigationHierarchy:options.withNavigationHierarchy});
		const editions = new EditionsModel();
		initPromises.push(navigation.init());
		app.use(editions.middleware.bind(editions));
		app.use(navigation.middleware.bind(navigation));
	}

	if (options.withAnonMiddleware) {
		app.use(anon.middleware);
	}

	// Handle th eakami -> fastly -> akamai etc. circular redirect bug
	if (options.withHandlebars) {
		app.use(function (req, res, next) {
			res.locals.forceOptInDevice = req.get('FT-Force-Opt-In-Device') === 'true';
			res.vary('FT-Force-Opt-In-Device');
			next();
		});
	}

	// Start the app - Woo hoo!
	const actualAppListen = app.listen;

	app.listen = function() {
		const args = [].slice.apply(arguments);
		app.use(raven.middleware);
		const port = args[0];
		const cb = args[1];
		args[1] = function () {
			// HACK: Use warn so that it gets into Splunk logs
			nLogger.warn({ event: 'EXPRESS_START', app: name, port: port, nodeVersion: process.version });
			return cb && cb.apply(this, arguments);
		};

		return Promise.all(initPromises)
			.then(function() {
				metrics.count('express.start');
				return actualAppListen.apply(app, args);
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

// expose internals the app may want access to
module.exports.Router = express.Router;
module.exports.static = express.static;
module.exports.metrics = metrics;
module.exports.flags = flags;
module.exports.cacheMiddleware = cache.middleware;
