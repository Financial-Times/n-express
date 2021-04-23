const raven = require('@financial-times/n-raven');
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const http = require('http');
const https = require('https');
const denodeify = require('denodeify');
const path = require('path');

const fs = require('fs');
const readFile = denodeify(fs.readFile);

module.exports = (app, meta, initPromises) => {
	async function createServer(app) {
		if (process.argv.indexOf('--https') > -1) {
			const [key, cert] = await Promise.all([
				readFile(path.resolve(__dirname, '../../key.pem')),
				readFile(path.resolve(__dirname, '../../cert.pem'))
			])

			return https.createServer({ key, cert }, app);
		} else {
			return http.createServer(app);
		}
	}

	async function actualAppListen(app, ...args) {
		const server = await createServer(app)

		return server.listen(...args);
	};

	app.listen = async function (port, callback) {
		// these middleware are attached in .listen so they're
		// definitely after any middleware added by the app itself

		// The error handler must be before any other error middleware
		app.use(raven.errorHandler());

		// Optional fallthrough error handler
		app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
			// The error id is attached to `res.sentry` to be returned
			// and optionally displayed to the user for support.
			res.statusCode = 500;
			res.end(res.sentry + '\n');
		});

		function wrappedCallback() {
			// HACK: Use warn so that it gets into Splunk logs
			nLogger.warn({ event: 'EXPRESS_START', app: meta.name, port: port, nodeVersion: process.version });

			if(callback) {
				return cb.apply(this, arguments);
			}
		};

		try {
			await Promise.all(initPromises)
		} catch(err) {
			// crash app if initPromises fail by throwing an error asynchronously outside of the promise
			// TODO: better error handling
			setTimeout(() => {
				throw err;
			});
		}

		metrics.count('express.start');
		return actualAppListen(app, port, wrappedCallback);
	};

	return app;
};
