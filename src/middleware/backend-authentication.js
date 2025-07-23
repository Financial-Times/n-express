/**
 * @import Express from 'express'
 */

const logger = require('@dotcom-reliability-kit/logger');

/**
 * @param {Express.Application} app
 * @returns {void}
 */
module.exports = (app) => {
	/** @type {string[]} */
	const backendKeys = [];

	if (process.env.FT_NEXT_BACKEND_KEY) {
		backendKeys.push(process.env.FT_NEXT_BACKEND_KEY);
	}
	if (process.env.FT_NEXT_BACKEND_KEY_OLD) {
		backendKeys.push(process.env.FT_NEXT_BACKEND_KEY_OLD);
	}

	if (!backendKeys.length) {
		const missingEnvVarsMessage = [
			'Backend authentication is disabled due to missing environment variables -',
			'If backend authentication isn\'t required then disable this middleware by setting the n-express \'withBackendAuthentication\' option to false.',
			'To enable backend authentication add the missing environment variables.',
			'For more info on backend authentication see https://github.com/Financial-Times/n-express#optional'
		];

		logger.warn({
			event: 'BACKEND_AUTHENTICATION_MISSING_ENV_VARS',
			message: missingEnvVarsMessage.join(' ')
		});

		return;
	}

	/** @type {Express.Handler} */
	const backendAuthentication = (req, res, next) => {
		// allow static assets, healthchecks, etc., through
		if (req.path.indexOf('/__') === 0) {
			next();
		} else if (
			backendKeys.includes(
				/** @type {string} */ (req.get('FT-Next-Backend-Key'))
			)
		) {
			res.set('FT-Backend-Authentication', 'true');
			next();
		} else if (
			backendKeys.includes(
				/** @type {string} */ (req.get('FT-Next-Backend-Key-Old'))
			)
		) {
			res.set('FT-Backend-Authentication', 'true');
			next();
		} else {
			res.set('FT-Backend-Authentication', 'false');
			if (process.env.NODE_ENV === 'production') {
				// Setting the WWW-Authenticate header tells ft.com-cdn
				// to serve stale content instead of 401s if there's a key error.
				res.set('WWW-Authenticate', 'FT-Backend-Key');
				res.status(401).json({
					status: 'Error',
					reason: 'Invalid backend key',
					source: 'n-express'
				});
			} else {
				next();
			}
		}
	};
	app.use(backendAuthentication);
};
