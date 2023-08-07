/**
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 */
// @ts-nocheck

const metrics = require('next-metrics');
const logger = require('@dotcom-reliability-kit/logger');
const http = require('http');
const https = require('https');
const denodeify = require('denodeify');
const path = require('path');
const {STATUS_CODES} = http;
const serializeRequest = require('@dotcom-reliability-kit/serialize-request');

const fs = require('fs');
const readFile = denodeify(fs.readFile);

module.exports = class InstrumentListen {
	constructor (app, meta, initPromises) {
		this.app = app;
		/** @type {TickingMetric[]} */
		this.tickingMetrics = [];
		this.server = null;
		this.initApp(meta, initPromises);
	}

	async createServer () {
		if (process.argv.includes('--https')) {
			const [key, cert] = await Promise.all([
				readFile(path.resolve(process.cwd(), 'self-signed-ssl-key.pem')),
				readFile(path.resolve(process.cwd(), 'self-signed-ssl-certificate.pem'))
			]).catch(() => {
				throw Error(
					'n-express was started with --https, but there\'s no self-signed certificate or key in your app directory. run `npx n-express-generate-certificate` to create one'
				);
			});

			return https.createServer({ key, cert }, this.app);
		} else {
			return http.createServer(this.app);
		}
	}

	initApp (meta, initPromises) {
		this.app.listen = async (port, callback) => {
			// these middleware are attached in .listen so they're
			// definitely after any middleware added by the app itself

			// Optional fallthrough error handler
			// eslint-disable-next-line no-unused-vars
			this.app.use((err, req, res, next) => {
				let statusCode = parseInt(err.statusCode || err.status || 500, 10);

				// There's clearly an error, so if the error has a status
				// code of less than `400` we should default to `500` to
				// ensure bad error handling doesn't send false positive
				// status codes. We also check that the status code is
				// a valid number.
				const isValidErrorStatus = (
					!Number.isNaN(statusCode) && // Possible if `error.status` is something unexpected, like an object
					statusCode >= 400 &&
					statusCode <= 599
				);

				res.statusCode = isValidErrorStatus ? statusCode : 500;
				const statusMessage = STATUS_CODES[res.statusCode] || STATUS_CODES[500];

				// If headers have been sent already then we need to hand off to
				// the final Express error handler as documented here:
				// https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
				//
				// This ensures that the app doesn't crash with `ERR_STREAM_WRITE_AFTER_END`
				if (res.headersSent) {
					logger.warn({
						event: 'EXPRESS_ERROR_HANDLER_FAILURE',
						message: 'The default n-express error handler could not output because the response has already been sent',
						request: serializeRequest(req)
					}, err);
					return next(err);
				}

				const output = `${res.statusCode} ${statusMessage}\n`;
				res.end(output);
			});

			function wrappedCallback () {
				// HACK: Use warn so that it gets into Splunk logs
				logger.warn({
					event: 'EXPRESS_START',
					message: `Express application ${meta.name} started`,
					app: meta.name,
					port: port,
					nodeVersion: process.version
				});

				if (callback) {
					return callback.apply(this, arguments);
				}
			}

			try {
				await Promise.all(initPromises);

				metrics.count('express.start');
				const server = await this.createServer();
				this.server = server;
				return server.listen(port, wrappedCallback);
			} catch (err) {
				// crash app if initPromises fail by throwing an error asynchronously outside of the promise
				// TODO: better error handling
				setTimeout(() => {
					throw err;
				});
			}
		};

		/**
		 * Attempts to clean up the ticking checks and close the server
		 */
		this.app.close = (callback) => {
			this.tickingMetrics.forEach(check => check.stop());
			if (this.server) {
				this.server.close(() => callback && callback());
			}
		};
	}

	addMetrics (item) {
		const items = (Array.isArray(item) ? item : [item]);
		this.tickingMetrics.push(...items);
	}
};
