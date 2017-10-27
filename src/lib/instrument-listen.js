const raven = require('@financial-times/n-raven');
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const http = require('http');
const https = require('https');
const denodeify = require('denodeify');
const path = require('path');
const fs = require('fs');

module.exports = (app, meta, initPromises) => {

	const actualAppListen = function () {
		let serverPromise;
		if (process.argv.indexOf('--https') > -1) {
			const readFile = denodeify(fs.readFile);
			serverPromise = Promise.all([
				readFile(path.resolve(__dirname, '../../key.pem')),
				readFile(path.resolve(__dirname, '../../cert.pem'))
			])
				.then(results => https.createServer({ key: results[0], cert: results[1] }, this));
		} else {
			serverPromise = Promise.resolve(http.createServer(this));
		}

		return serverPromise.then(server => server.listen.apply(server, arguments));
	};

	app.listen = function () {
		const args = [].slice.apply(arguments);

		// The error handler must be before any other error middleware
		app.use(raven.errorHandler());

		// Optional fallthrough error handler
		app.use((err, req, res, next) => { //eslint-disable-line
			// The error id is attached to `res.sentry` to be returned
			// and optionally displayed to the user for support.
			res.statusCode = 500;
			res.end(res.sentry + '\n');
		});

		const port = args[0];
		const cb = args[1];
		args[1] = function () {
			// HACK: Use warn so that it gets into Splunk logs
			nLogger.warn({ event: 'EXPRESS_START', app: meta.name, port: port, nodeVersion: process.version });
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

	return app;
};
