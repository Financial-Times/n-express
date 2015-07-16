'use strict';

var util = require('util');

// default checks for all express applications
module.exports = function(appName, customChecks) {

	var requests = util.format('heroku.%s.*.express.http.req.count', appName);
	var errors = util.format('heroku.%s.*.express.http.res.status_5xx.count', appName);
	var responseTime = util.format('heroku.%s.*.express.http.res.status_2xx_response_time.mean', appName);

	return customChecks.concat([
		{
			check: util.format('divideSeries(sumSeries(%s),sumSeries(%s))', requests, errors),
			name: "error-rate",
			message: "The ratio of errors to good responses is above a healthy rate",
			warn: 0.75,
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
			serviceLevel: 'bronze',
			escalation: ['slack_next_dev', 'email_next_team', 'pager_duty']
		}
	]);

};
