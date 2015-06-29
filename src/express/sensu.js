'use strict';

var util = require('util');


module.exports = function(req, res) {

	var requests = util.format('heroku.%s.*.express.http.req.count', req.app.locals.__name);
	var errors = util.format('heroku.%s.*.express.http.req.count', req.app.locals.__name);
	var responseTime = util.format('heroku.%s.*.express.http.res.status_2xx_response_time.mean', req.app.locals.__name);

	res.json([
		{
			check: util.format('divideSeries(sumSeries(%s),sumSeries(%s))', requests, errors),
			name: "error-rate",
			message: "The ratio of errors to good responses is above a healthy rate",
			warn: 0.05,
			critical: 1,
			occurences: 3,
			interval: 60,
			serviceLevel: 'bronze',
			escalation: ['slack_next_dev']
		},
		{
			check: util.format('sumSeries(%s)', responseTime),
			name: "mean-response-time",
			message: "Mean response time is above normal",
			warn: 500,	// 500ms
			critical: 1000,
			occurences: 3,
			interval: 60,
			serviceLevel: 'gold',
			escalation: ['slack_next_dev', 'email_next_team', 'pager_duty']
		}
	]);

};
