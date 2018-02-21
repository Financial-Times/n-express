require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const express = require('express');
const flags = require('@financial-times/n-flags-client');
const backendAuthentication = require('./src/middleware/backend-authentication');

// Logging and monitoring
const metrics = require('next-metrics');
const serviceMetrics = require('./src/lib/service-metrics');
const raven = require('@financial-times/n-raven');

// utils
const healthChecks = require('./src/lib/health-checks');
const instrumentListen = require('./src/lib/instrument-listen');
const guessAppDetails = require('./src/lib/guess-app-details');

const cache = require('./src/middleware/cache');
const robots = require('./src/middleware/robots');
const security = require('./src/middleware/security');
const vary = require('./src/middleware/vary');
const logVary = require('./src/middleware/log-vary');
const anon = require('./src/middleware/anon');
const teapot = fs.readFileSync(path.join(__dirname, 'src/assets/teapot.ascii'), 'utf8');

const getAppContainer = options => {

	options = Object.assign({}, {
		withBackendAuthentication: true,
		withFlags: false,
		withServiceMetrics: true,
		healthChecks: []
	}, options || {});

	if (!options.systemCode) {
		throw new Error('All applications must specify a CMDB `systemCode` to the express() function. See the README for more details.');
	}

	const meta = guessAppDetails(options);
	const initPromises = [];
	const app = instrumentListen(express(), meta, initPromises);
	const addInitPromise = initPromises.push.bind(initPromises);

	// must be the first middleware
	app.use(raven.requestHandler());

	app.get('/robots.txt', robots);
	/*istanbul ignore next */
	app.get('/__brew-coffee', (req, res) => {
		res.status(418);
		res.send(teapot);
		res.end();
	});

	// Security related headers, see https://securityheaders.io/?q=https%3A%2F%2Fwww.ft.com&hide=on.
	app.set('x-powered-by', false);
	app.use(security);

	// utility middleware
	app.use(vary);

	if (!options.demo) {
		healthChecks(app, options, meta);
	}

	// Debug related headers.
	app.use((req, res, next) => {
		res.set('FT-App-Name', meta.name);
		res.set('FT-Backend-Timestamp', new Date().toISOString());
		next();
	});

	// metrics should be one of the first things as needs to be applied before any other middleware executes
	metrics.init({
		app: process.env.FT_APP_VARIANT ? `${meta.name}_${process.env.FT_APP_VARIANT}` : meta.name,
		flushEvery: 40000
	});
	app.use((req, res, next) => {
		metrics.instrument(req, { as: 'express.http.req' });
		metrics.instrument(res, { as: 'express.http.res' });
		next();
	});

	if (options.withServiceMetrics) {
		serviceMetrics.init();
	}

	app.get('/__about', (req, res) => {
		res.set({ 'Cache-Control': 'no-cache' });
		res.sendFile(meta.directory + '/public/__about.json');
	});

	if (options.withBackendAuthentication) {
		backendAuthentication(app, meta.name);
	}

	// feature flags
	if (options.withFlags) {
		addInitPromise(flags.init());
		app.use(flags.middleware);
	}

	// cache-control constants
	app.use(cache);

	if (options.logVary) {
		app.use(logVary);
	}

	if (options.withAnonMiddleware) {
		app.use(anon.middleware);
	}

	return { app, meta, addInitPromise };
};

module.exports = options => getAppContainer(options).app;

// expose internals the app may want access to
module.exports.Router = express.Router;
module.exports.static = express.static;
module.exports.metrics = metrics;
module.exports.flags = flags;
module.exports.getAppContainer = getAppContainer;
