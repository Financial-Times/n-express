/**
 * @typedef {import("express").Application} ExpressApp
 * @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
 * @typedef {import("../../typings/metrics").TickingMetric} TickingMetric
 * @typedef {import("../../typings/n-express").AppOptions} AppOptions
 */

const logger = require('@dotcom-reliability-kit/logger');

const metricsHealthCheck = require('./metrics-healthcheck');
const supportedNodeJsVersionCheck = require('./supported-node-js-version-check');

/**
 * @param {ExpressApp} app
 * @param {AppOptions} options
 * @param {{name: string, description: string}} meta
 * @returns {(Healthcheck & TickingMetric)[]}
 */
module.exports = (app, options, meta) => {
	const defaultAppName = `Next FT.com ${meta.name} in ${
		process.env.REGION || 'unknown region'
	}`;
	/**
	 * Add checks to this array if they use an interval or similar
	 * to poll for data. This allows them to be properly stopped
	 * alongside the n-express app.
	 *
	 * @type {(Healthcheck & TickingMetric)[]}
	 */
	const tickingMetricChecks = [];

	/** @type {Healthcheck[]} */
	const defaultChecks = [
		...tickingMetricChecks,
		metricsHealthCheck(meta.name),
		supportedNodeJsVersionCheck(meta.name)
	];

	/** @type {Healthcheck[]} */
	const healthChecks = options.healthChecks.concat(defaultChecks);

	app.get(
		/\/__health(?:\.([123]))?$/,
		/** @type {ExpressApp} */ (req, res) => {
			res.set({ 'Cache-Control': 'private, no-cache, max-age=0' });
			const checks = healthChecks.map((check) => check.getStatus());

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

	return tickingMetricChecks;
};
