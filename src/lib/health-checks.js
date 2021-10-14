/**
 * @typedef {import("express").Application} ExpressApp
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/n-express").AppOptions} AppOptions
 */

const errorRateCheck = require('./error-rate-check');
const unRegisteredServicesHealthCheck = require('./unregistered-services-healthCheck');
const metricsHealthCheck = require('./metrics-healthcheck');
const nLogger = require('@financial-times/n-logger').default;

/**
 * @param {ExpressApp} app
 * @param {AppOptions} options
 * @param {{name: string, graphiteName: string, description: string}} meta
 */
module.exports = (app, options, meta) => {
	const defaultAppName = `Next FT.com ${meta.name} in ${
		process.env.REGION || 'unknown region'
	}`;

	/** @type {Healthcheck[]} */
	const defaultChecks = [
		errorRateCheck(meta.graphiteName, options.errorRateHealthcheck),
		unRegisteredServicesHealthCheck.setAppName(meta.name),
		metricsHealthCheck(meta.name)
	];

	/** @type {Healthcheck[]} */
	const healthChecks = options.healthChecks.concat(defaultChecks);

	app.get(
		/\/__health(?:\.([123]))?$/,
		/** @type {ExpressApp} */ (req, res) => {
			res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
			const checks = healthChecks.map((check) => check.getStatus());

			checks.forEach(check => {if(!check.id){
				nLogger.warn({
					event: 'HEALTHCHECK_IS_MISSING_ID',
					systemName: options.healthChecksAppName || defaultAppName,
					systemCode: options.systemCode,
					checkName: check.name
				});
			}})

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
