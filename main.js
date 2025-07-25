/**
 * @import {Application} from 'express'
 * @import {AppContainer, AppOptions, Callback} from './typings/n-express'
 */

const express = require('express');

// flags
const flags = require('@financial-times/n-flags-client');

// backend authentication
const backendAuthentication = require('./src/middleware/backend-authentication');

// consent
const consentMiddleware = require('./src/middleware/consent');

// logging and monitoring
const metrics = require('next-metrics');
const { logUnhandledError } = require('@dotcom-reliability-kit/log-error');

if (!global.fetch) {
	logUnhandledError({
		error: Object.assign(
			new Error(
				'No global fetch method is defined, this may cause unexpected errors. Either remove the --no-experimental-fetch flag and migrate to native fetch, or install isomorphic-fetch explicitly'
			),
			{ code: 'MISSING_GLOBAL_FETCH' }
		)
	});
	process.exit(1);
}

// utils
const setupHealthEndpoint = require('./src/lib/health-checks');
const InstrumentListen = require('./src/lib/instrument-listen');
const guessAppDetails = require('./src/lib/guess-app-details');

const { cache } = require('./src/middleware/cache');
const robots = require('./src/middleware/robots');
const security = require('./src/middleware/security');
const vary = require('./src/middleware/vary');
const anon = require('./src/middleware/anon');

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
			healthChecks: []
		},
		options || {}
	);

	if (!options.systemCode) {
		throw new Error(
			'All applications must specify a Biz Ops `systemCode` to the express() function. See the README for more details.'
		);
	}

	const meta = guessAppDetails(options);

	/** @type {Promise<any>[]} */
	const initPromises = [];

	const instrumentListen = new InstrumentListen(express(), meta, initPromises);
	const app = instrumentListen.app;

	const addInitPromise = initPromises.push.bind(initPromises);

	app.get('/robots.txt', robots);

	// Security related headers, see https://securityheaders.io/?q=https%3A%2F%2Fwww.ft.com&hide=on.
	app.set('x-powered-by', false);
	app.use(security);

	// utility middleware
	app.use(vary);

	if (!options.demo) {
		setupHealthEndpoint(app, options, meta);
	}

	// Debug related headers.
	app.use(
		/** @type {Callback} */ function setDebugHeaders (req, res, next) {
			res.set('FT-App-Name', meta.name);
			res.set('FT-Backend-Timestamp', new Date().toISOString());
			res.set('FT-System-Code', meta.systemCode);
			next();
		}
	);

	if (options.withBackendAuthentication) {
		backendAuthentication(app);
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
