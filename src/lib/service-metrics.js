const metrics = require('next-metrics');
const unRegisteredServicesHealthCheck = require('./unregistered-services-healthCheck');
let unregisteredServices = {};

module.exports = {
	init: () => metrics.fetch.instrument({
		onUninstrumented: function (url) {
			if (typeof url === 'string') {
				unregisteredServices[url.split('?')[0]] = true;
			}
			unRegisteredServicesHealthCheck.updateCheck(unregisteredServices);
			setInterval(unRegisteredServicesHealthCheck.updateCheck(unregisteredServices), 5 * 60 * 1000);
		}
	})
};
