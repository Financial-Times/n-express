let lastCheckOk = true;
let lastCheckOutput = 'All services\' metrics are set up in Next-metrics';
let panicGuide = 'Don\'t panic';
let lastCheckTime = new Date();

module.exports = {
	getStatus: () => {
		return {
			name: 'Services\' metrics are set up in next-metrics',

			ok: lastCheckOk,
			checkOutput: lastCheckOutput,
			lastUpdated: lastCheckTime,
			panicGuide: panicGuide,

			severity: 3, //TODO set correct severity
			businessImpact: '...', //TODO set correct businessImpact
			technicalSummary: 'Set up services\' metrics in next-metrics/lib/metrics/services.js to sent to Graphite'
		};
	},
	updateCheck: (unregisteredServices) => {
		lastCheckTime = new Date();

		if (Object.keys(unregisteredServices).length > 0) {
			lastCheckOutput = Object.keys(unregisteredServices).join(', ') + ' services called but no metrics set up. See next-metrics/lib/metrics/services.js';
			lastCheckOk = false;
		} else {
			lastCheckOutput = 'All services\' metrics are set up in Next-metrics';
			lastCheckOk = true;
		}
	}
};
