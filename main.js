require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const https = require('https');
const denodeify = require('denodeify');

const flags = require('next-feature-flags-client');
const backendAuthentication = require('./src/middleware/backend-authentication');

// Logging and monitoring
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const serviceMetrics = require('./src/lib/service-metrics');
const raven = require('@financial-times/n-raven');
const healthChecks = require('./src/lib/health-checks');

// utils
const normalizeName = require('./src/lib/normalize-name');
const robots = require('./src/middleware/robots');
const vary = require('./src/middleware/vary');
const cache = require('./src/middleware/cache');

// Health check failure simulation
const checkFailing = require('./src/lib/check-failing');
const teapot = fs.readFileSync(path.join(__dirname, 'src/assets/teapot.ascii'), 'utf8');

const guessAppDetails = options => {
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

	name = name && normalizeName(name);

	return {name, description, directory};
}


function chain () {
	checkFailing.init();

	const app = express();
	const initPromises = [];

	const actualAppListen = function () {
		let serverPromise;
		if (process.argv.indexOf('--https') > -1) {
			const readFile = denodeify(fs.readFile);
			serverPromise = Promise.all([
				readFile(path.resolve(__dirname, 'key.pem')),
				readFile(path.resolve(__dirname, 'cert.pem'))
			])
				.then(results => https.createServer({ key: results[0], cert: results[1] }, this));
		} else {
			serverPromise = Promise.resolve(http.createServer(this));
		}

		return serverPromise.then(server => server.listen.apply(server, arguments));
	};

	app.listen = function () {
		const args = [].slice.apply(arguments);
		app.use(raven.middleware);
		const port = args[0];
		const cb = args[1];
		args[1] = function () {
			// HACK: Use warn so that it gets into Splunk logs
			nLogger.warn({ event: 'EXPRESS_START', app: app.nextMeta.name, port: port, nodeVersion: process.version });
			return cb && cb.apply(this, arguments);
		};

		return Promise.all(initPromises)
			.then(() => {
				metrics.count('express.start');
				return actualAppListen.apply(app, args);
			})
			// Crash app if initPromises fail
			.catch(err => setTimeout(() => {
				throw err;
			}));
	};

	return Object.create(chainConstructor, {
		app: {value: app},
		addInitPromise: {value: initPromises.push.bind(initPromises)}
	});
}

const chainConstructor = {
	config: function (options) {
		//Remove x-powered-by header
		this.app.set('x-powered-by', false);

		this.app.get('/robots.txt', robots);

		this.app.get('/__brew-coffee', (req, res) => {
			res.status(418);
			res.send(teapot);
			res.end();
		});

		// utility middleware
		this.app.use(cache);
		this.app.use(vary);
		this.app.nextMeta = guessAppDetails(options)
		return this;
	},

	healthChecks: function (systemCode, checks) {
		healthChecks(this.app, {systemCode, healthChecks: checks}, this.app.nextMeta.description)
		return this;
	},

	about: function () {
		this.app.get('/__about', (req, res) => {
			res.set({ 'Cache-Control': 'no-cache' });
			res.sendFile(this.app.nextMeta.directory + '/public/__about.json');
		});
		return this;
	},

	metrics: function (downstreamMetrics) {
		// metrics should be one of the first things as needs to be applied before any other middleware executes
		metrics.init({ app: this.app.nextMeta.name, flushEvery: 40000 });
		this.app.use((req, res, next) => {
			metrics.instrument(req, { as: 'express.http.req' });
			metrics.instrument(res, { as: 'express.http.res' });
			next();
		});

		if (downstreamMetrics) {
			serviceMetrics.init();
		}
		return this;
	},

	timestamp: function () {
		this.app.use((req, res, next) => {
			res.set('FT-Backend-Timestamp', new Date().toISOString());
			next();
		});

		return this;
	},

	backendAuth: function (withAuth) {
		// Only allow authorized upstream applications access
		if (withAuth) {
			this.app.use(backendAuthentication(this.app.nextMeta.name));
		} else {
			nLogger.warn({ event: 'BACKEND_AUTHENTICATION_DISABLED', message: 'Backend authentication is disabled, this app is exposed directly to the internet' });
		}
		return this;
	},

	flags: function (withFlags) {
		// feature flags
		if (withFlags) {
			this.addInitPromise(flags.init());
			this.app.use(flags.middleware);
		}
		return this;
	},

	withEverything: function () {
		return this
			.about()
			.metrics(true)
			.timestamp()
			.backendAuth(true)
			.flags(true)
	}
}

module.exports = options => {
	options = options || {};

	const defaults = {
		withFlags: false,
		withBackendAuthentication: false,
		withServiceMetrics: true,
		healthChecks: []
	};

	Object.keys(defaults).forEach(prop => {
		if (typeof options[prop] === 'undefined') {
			options[prop] = defaults[prop];
		}
	});

	// When adding to the chain below please consider whether n-ui
	// (Which wraps n-express and calls these methods in a different order)
	// needs to be updated too
	const app = chain()
		.config(options)
		.healthChecks(options.systemCode, options.healthChecks)
		.about()
		.metrics(options.withServiceMetrics)
		.timestamp()
		.backendAuth(options.withBackendAuthentication)
		.flags(options.withFlags)
		.app;

	return app;
};

// expose internals the app may want access to
module.exports.Router = express.Router;
module.exports.static = express.static;
module.exports.metrics = metrics;
module.exports.flags = flags;
module.exports.chain = chain;
