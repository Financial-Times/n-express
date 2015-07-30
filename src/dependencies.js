'use strict';

var fetchres = require('fetchres');
var services = require('./service-metrics').services;

module.exports = function(app) {
	app = 'article';
	return function(req, res, next) {
		var from = new Date((new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
		var url = 'https://www.hostedgraphite.com/bbaf3ccf/' + process.env.HOSTEDGRAPHITE_READ_APIKEY
			+ '/graphite/metrics/?query=heroku.' + app + '.*.fetch.*&from='
			+ (from.getTime()/1000).toFixed(0);
		fetch(url)
			.then(fetchres.json)
			.then(function(data) {
				res.json({
					from: from,
					services: data.map(function(dependency) {
							var matcher = services[dependency.text];
							return {
								name: dependency.text,
								matcher: matcher ? matcher.toString() : 'could not find regex for this service'
							};
						})
				});
			})
			.catch(function(err) {
				if (err.name === fetchres.BadServerResponseError.name) {
					res.status(404);
					res.json([]);
				} else {
					next(err);
				}
			});
	};
};
