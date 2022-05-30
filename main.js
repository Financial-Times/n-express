/**
 * @typedef {import("express").Application} Application
 * @typedef {import("./typings/n-express").Callback} Callback
 * @typedef {import("./typings/n-express").AppOptions} AppOptions
 * @typedef {import("./typings/n-express").AppContainer} AppContainer
 * @typedef {import("./typings/metrics").TickingMetric} TickingMetric
 */

require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const express = require('express');

// flags
const flags = require('@financial-times/n-flags-client');

// backend authentication
const backendAuthentication = require('./src/middleware/backend-authentication');

// consent
const consentMiddleware = require('./src/middleware/consent');

// logging and monitoring
const metrics = require('next-metrics');
const serviceMetrics = require('./src/lib/service-metrics');
const raven = require('@financial-times/n-raven');
const nLogger = require('@financial-times/n-logger').default;

// utils
const healthChecks = require('./src/lib/health-checks');
const InstrumentListen = require('./src/lib/instrument-listen');
const guessAppDetails = require('./src/lib/guess-app-details');

const { cache } = require('./src/middleware/cache');
const robots = require('./src/middleware/robots');
const security = require('./src/middleware/security');
const vary = require('./src/middleware/vary');
const logVary = require('./src/middleware/log-vary');
const anon = require('./src/middleware/anon');
const teapot = fs.readFileSync(
	path.join(__dirname, 'src/assets/teapot.ascii'),
	'utf8'
);

/**
 * @param {AppOptions} options
 * @returns {AppContainer}
 */
const getAppContainer = (options) => {
	options = Object.assign(
		{},
		{
			withBackendAuthentication: true,
			withFlags: false,
			withConsent: false,
			withServiceMetrics: true,
			healthChecks: []
		},
		options || {}
	);

	if (!options.systemCode) {
		throw new Error(
			'All applications must specify a Biz Ops `systemCode` to the express() function. See the README for more details.'
		);
	}

	if (options.withAb) {
		nLogger.warn({
			event: 'WITHAB_OPTION_DEPRECATED',
			message: 'The \'withAb\' option is deprecated and no longer supported by n-express or n-flags-client'
		});
	}

	const meta = guessAppDetails(options);

	/** @type {Promise<any>[]} */
	const initPromises = [];

	const instrumentListen = new InstrumentListen(express(), meta, initPromises);
	const app = instrumentListen.app;

	const addInitPromise = initPromises.push.bind(initPromises);

	// must be the first middleware
	app.use(raven.requestHandler());

	app.get('/robots.txt', robots);

	/*istanbul ignore next */
	app.get(
		'/__brew-coffee',
		/** @type {Callback} */ (req, res) => {
			res.status(418);
			res.send(teapot);
			res.end();
		}
	);

	// Security related headers, see https://securityheaders.io/?q=https%3A%2F%2Fwww.ft.com&hide=on.
	app.set('x-powered-by', false);
	app.use(security);

	// utility middleware
	app.use(vary);

	if (!options.demo) {
		instrumentListen.addMetrics(healthChecks(app, options, meta));
	}

	// Debug related headers.
	app.use(
		/** @type {Callback} */ (req, res, next) => {
			res.set('FT-App-Name', meta.name);
			res.set('FT-Backend-Timestamp', new Date().toISOString());
			res.set('FT-System-Code', meta.systemCode);
			next();
		}
	);

	// metrics should be one of the first things as needs to be applied before any other middleware executes
	metrics.init({
		flushEvery: 40000
	});
	app.use(
		/** @type {Callback} */ (req, res, next) => {
			metrics.instrument(req, { as: 'express.http.req' });
			metrics.instrument(res, { as: 'express.http.res' });
			next();
		}
	);

	if (options.withServiceMetrics) {
		instrumentListen.addMetrics(serviceMetrics.init());
	}

	app.get(
		'/__about',
		/** @type {Callback} */ (req, res) => {
			res.set({ 'Cache-Control': 'no-cache' });
			res.sendFile(meta.directory + '/public/__about.json');
		}
	);

	if (options.withBackendAuthentication) {
		backendAuthentication(app, meta.name);
	}

	// feature flags
	if (options.withFlags) {
		addInitPromise(flags.init());
		app.use(flags.middleware);
	}

	// consent preference flags
	if (options.withConsent) {
		app.use(consentMiddleware);
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

/**
 * @param {AppOptions} options
 * @returns {Application}
 */
module.exports = (options) => getAppContainer(options).app;

// expose internals the app may want access to
module.exports.json = express.json;
module.exports.text = express.text;
module.exports.urlencoded = express.urlencoded;
module.exports.Router = express.Router;
module.exports.static = express.static;
module.exports.metrics = metrics;
module.exports.flags = flags;
module.exports.getAppContainer = getAppContainer;
