/**
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
// @ts-nocheck

const raven = require('@financial-times/n-raven');
const metrics = require('next-metrics');
const nLogger = require('@financial-times/n-logger').default;
const http = require('http');
const https = require('https');
const denodeify = require('denodeify');
const path = require('path');

const fs = require('fs');
const readFile = denodeify(fs.readFile);

module.exports = class InstrumentListen {
	constructor(app, meta, initPromises) {
		this.app = app;
		/** @type {TickingMetric[]} */
		this.tickingMetrics = [];
		this.server = null;
		this.initApp(meta, initPromises);
	}

	async createServer(app) {
		if (process.argv.includes('--https')) {
			const [key, cert] = await Promise.all([
				readFile(path.resolve(process.cwd(), 'self-signed-ssl-key.pem')),
				readFile(path.resolve(process.cwd(), 'self-signed-ssl-certificate.pem'))
			]).catch(() => {
				throw Error(
					"n-express was started with --https, but there's no self-signed certificate or key in your app directory. run `npx n-express-generate-certificate` to create one"
				);
			});

			return https.createServer({ key, cert }, app);
		} else {
			return http.createServer(app);
		}
	}

	initApp(meta, initPromises) {
		this.app.listen = async (port, callback) => {
			// these middleware are attached in .listen so they're
			// definitely after any middleware added by the app itself
	
			// The error handler must be before any other error middleware
			this.app.use(raven.errorHandler());
	
			// Optional fallthrough error handler
			// eslint-disable-next-line no-unused-vars
			this.app.use((err, req, res, next) => {
				// The error id is attached to `res.sentry` to be returned
				// and optionally displayed to the user for support.
				res.statusCode = 500;
				res.end(res.sentry + '\n');
			});
	
			function wrappedCallback() {
				// HACK: Use warn so that it gets into Splunk logs
				nLogger.warn({
					event: 'EXPRESS_START',
					app: meta.name,
					port: port,
					nodeVersion: process.version
				});
	
				if (callback) {
					return callback.apply(this, arguments);
				}
			}
	
			try {
				console.log('!!!initPromisesStart')
				await Promise.all(initPromises);
				console.log('!!!initPromisesEnd')
				metrics.count('express.start');
				const server = await this.createServer(this.app);
				this.server = server;
				return server.listen(port, wrappedCallback);
			} catch (err) {
				// crash app if initPromises fail by throwing an error asynchronously outside of the promise
				// TODO: better error handling
				console.log('ERROR-INSTURMENT-LISTEN', err)
	
				setTimeout(() => {
					throw err;
				});
			}
		};

		this.app.close = (callback) => {
			console.log('calling closing!')
			const server = this.server;
			this.tickingMetrics.forEach(check => check.stop())
			if(server) {
				server.close(() => callback && callback())
			}
		}
	}

	addMetrics(item) {
		this.tickingMetrics.push(item)
	}
}
