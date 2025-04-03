// @ts-nocheck

const logger = require('@dotcom-reliability-kit/logger');
const http = require('http');
const https = require('https');
const path = require('path');
const {readFile} = require('fs/promises');

module.exports = class InstrumentListen {
	constructor (app, meta, initPromises) {
		this.app = app;
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
			if (this.server) {
				this.server.close(() => callback && callback());
			}
		};
	}
};
