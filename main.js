/*jshint node:true*/
"use strict";

require('isomorphic-fetch');

const denodeify = require('denodeify');
const express = require('express');
const raven = require('@financial-times/n-raven');
const flags = require('next-feature-flags-client');
const handlebars = require('@financial-times/n-handlebars');
const navigation = require('@financial-times/n-navigation');
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const robots = require('./src/express/robots');
const normalizeName = require('./src/normalize-name');
const anon = require('./src/anon');
const serviceMetrics = require('./src/service-metrics');
const vary = require('./src/middleware/vary');
const cache = require('./src/middleware/cache');
const nUi = require('./src/middleware/n-ui');
const headCssMiddleware = require('./src/middleware/head-css');
const backendKeys = [];
if (process.env.FT_NEXT_BACKEND_KEY) {
	backendKeys.push(process.env.FT_NEXT_BACKEND_KEY);
}
if (process.env.FT_NEXT_BACKEND_KEY_OLD) {
	backendKeys.push(process.env.FT_NEXT_BACKEND_KEY_OLD);
}
if (process.env.FT_NEXT_BACKEND_KEY_OLDEST) {
	backendKeys.push(process.env.FT_NEXT_BACKEND_KEY_OLDEST);
}

module.exports = function(options) {

	options = options || {};

	const defaults = {
		withFlags: false,
		withHandlebars: false,
		withNavigation: false,
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
	const healthChecks = options.healthChecks;

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
			} else if (backendKeys.indexOf(req.get('FT-Next-Backend-Key')) !== -1) {
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
	} else {
		nLogger.warn({ event: 'BACKEND_AUTHENTICATION_DISABLED', message: 'Backend authentication is disabled, this app is exposed directly to the internet' });
	}

	if (!app.locals.__isProduction) {
		app.use('/' + name, express.static(directory + '/public'));
	}

	app.get('/robots.txt', robots);
	app.get('/__brew-coffee', function(req, res) {
		res.sendStatus(418);
	});

	app.get(/\/__health(?:\.([123]))?$/, function(req, res) {
		res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
		const checks = healthChecks.map(function(check) {
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

		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify({
			schemaVersion: 1,
			name: `Next FT.com ${app.locals.__name} in ${process.env.REGION || 'unknown region'}`,
			systemCode: options.systemCode,
			description: description,
			checks: checks
		}, undefined, 2));
	});


	let handlebarsPromise = Promise.resolve();

	if (options.withHandlebars) {
		const helpers = options.helpers || {};
		helpers.hashedAsset = require('./src/handlebars/hashed-asset')(app.locals);

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

	app.use(cache);
	app.use(vary);

	app.locals.assetsDirectory = '';
	if (options.hasNUiBundle) {
		app.use(nUi);
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

	let flagsPromise = Promise.resolve();

	if (options.withFlags) {
		flagsPromise = flags.init();
		app.use(flags.middleware);
	}

	if (options.withAnonMiddleware) {
		app.use(anon.middleware);
	}

	if (options.withNavigation) {
		flagsPromise.then(navigation.init);
		app.use(navigation.middleware);
	}

	// get head css
	const readFile = denodeify(require('fs').readFile);
	const headCssPromise = options.hasHeadCss ? readFile(directory + '/public/head.css', 'utf-8') : Promise.resolve();
	app.use(headCssMiddleware(headCssPromise));

	if (options.withHandlebars) {
		app.use(function (req, res, next) {
			res.locals.forceOptInDevice = req.get('FT-Force-Opt-In-Device') === 'true';
			res.vary('FT-Force-Opt-In-Device');
			next();
		});
	}

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

		return Promise.all([flagsPromise, handlebarsPromise, headCssPromise])
			.then(function() {
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
module.exports.metrics = metrics;
module.exports.flags = flags;
module.exports.cacheMiddleware = cache.middleware;
