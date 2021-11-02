/**
* @typedef {import("../../typings/metrics").Healthcheck} Healthcheck
*/

const metrics = require('next-metrics');
const unRegisteredServicesHealthCheck = require('./unregistered-services-healthCheck');

/** @type {Record<string, any>} */
let unregisteredServices = {};

/**
* @returns {TickingMetric}
*/
module.exports = {
	init: () => {
		const id = setInterval(() => {
			unRegisteredServicesHealthCheck.updateCheck(unregisteredServices);
		}, 1 * 60 * 1000);

		metrics.fetch.instrument({
			onUninstrumented: function (/** @type {string} */ url) {
				if (typeof url === 'string') {
					unregisteredServices[url.split('?')[0]] = true;
				}
			}
		});

		const stop = () => {
			clearInterval(id);
		}

		return { stop };
	}
};
