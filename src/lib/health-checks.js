/**
 * @import {Application as ExpressApp} from 'express'
 * @import {AppOptions} from '../../typings/n-express'
 */

const logger = require('@dotcom-reliability-kit/logger');

/**
 * @param {ExpressApp} app
 * @param {AppOptions} options
 * @param {{name: string, description: string}} meta
 * @returns {void}
 */
module.exports = (app, options, meta) => {
	const defaultAppName = `Next FT.com ${meta.name} in ${
		process.env.REGION || 'unknown region'
	}`;

	app.get(
		/\/__health(?:\.([123]))?$/,
		/** @type {ExpressApp} */ (req, res) => {
			res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
			const checks = options.healthChecks.map((check) => check.getStatus());

			checks.forEach(check => {if(!check.id){
				logger.warn({
					event: 'HEALTHCHECK_IS_MISSING_ID',
					message: `The ${check.name} healthcheck is missing an ID`,
					systemName: options.healthChecksAppName || defaultAppName,
					systemCode: options.systemCode,
					checkName: check.name
				});
			}});

			checks.forEach(check => {if(!check.ok){
				logger.debug({
					event: 'HEALTHCHECK_IS_FAILING',
					message: `The ${check.name} healthcheck is failing`,
					systemCode: options.systemCode,
					checkOutput: check.checkOutput
				});
			}});

			if (req.params[0]) {
				checks.forEach((check) => {
					if (check.severity <= Number(req.params[0]) && check.ok === false) {
						res.status(500);
					}
				});
			}

			res.set('Content-Type', 'application/json');
			res.send(
				JSON.stringify(
					{
						schemaVersion: 1,
						name: options.healthChecksAppName || defaultAppName,
						systemCode: options.systemCode,
						description: meta.description,
						checks: checks
					},
					undefined,
					2
				)
			);
		}
	);
};
