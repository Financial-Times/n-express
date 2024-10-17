/**
 * @import {Callback} from '../../typings/n-express'
 */

/**
 * @type {Callback}
 */
module.exports = (_req, res, next) => {
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('X-Download-Options', 'noopen');
	res.set('X-XSS-Protection', '1; mode=block');
	next();
};
