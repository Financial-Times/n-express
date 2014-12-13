"use strict";

var express = require('express');
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var flagsPromise = flags.init();

module.exports = function(options) {
	options = options || {};
	var app = express();
	var name = options.name
	if (!name) throw new Error("Please specify an application name");

	if (options.public) {
		app.use('/' + name, express.static(options.public, {
			maxAge: 120000 // 2 minutes
		}));
	}

	app.use(flags.middleware);

	app._listen = app.listen;
	app.listen = function() {
		var args = arguments;
		app.get('/robots.txt', function(req, res) {
			res.set({
				'Content-Type': 'text/plain',
				'Cache-Control': 'max-age:3600, public'
			});
			res.send("User-agent: *\nDisallow: /");
		});
		app.use(errorsHandler.middleware);

		flagsPromise.then(function() {
			app._listen.apply(app, args);
		});
	};

	return app;
};
