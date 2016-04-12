/*jshint node:true*/
"use strict";

require('isomorphic-fetch');

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

module.exports = function(options) {


	options = options || {};

	const defaults = {
		withFlags: false,
		withHandlebars: false,
		withNavigation: false,
		withAnonMiddleware: false,
		withBackendAuthentication: false,
		withRequestTracing: false,
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

	if (!name) throw new Error("Please specify an application name");

	// Temporarily disabled while investigating build problems
	// if (options.withRequestTracing && process.env.NODE_ENV === 'production') {
	// 	if (process.env.TRACE_API_KEY) {
	// 		process.env.TRACE_SERVICE_NAME = normalizeName(name);
	// 		require('@risingstack/trace');
	// 	} else {
	// 		nLogger.warn('TRACE_API_KEY and TRACE_SERVICE_NAME are required to apply request tracing');
	// 	}
	// }

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
			name: "Next FT " + app.locals.__name,
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

	app.use(vary);

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
		app.use(navigation.middleware);
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
		}

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
module.exports.metrics = metrics;
module.exports.flags = flags;
