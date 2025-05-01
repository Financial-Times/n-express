/**
 * @import {Callback} from '../../typings/n-express'
 */

const headers = {
	'Content-Type': 'text/plain',
	'Cache-Control': `public, max-age=${60 * 60 * 24 * 30}` // One month
};

// This is a string rather than a separate file because we don't want
// this fallback robots.txt file to be modified or added to. This is
// used to block good bots from crawling our apps directly and should
// not be used to grant access - that's the job of the CDN.
const content = 'User-agent: *\nDisallow: /\n';

/** @type {Callback} */
module.exports = function robots (_request, response) {
	response.set(headers).send(content);
};
