"use strict";

var express = require('express');
var errorsHandler = require('express-errors-handler');
var flags = require('next-feature-flags-client');
var expressHandlebars = require('express-handlebars');
var resize = require('./src/resize');
var robots = require('./src/robots');

var flagsPromise = flags.init();

module.exports = function(options) {
	options = options || {};
	var app = express();
	var name = options.name
	var directory = options.directory
	var helpers = options.helpers || {}
	if (!name) throw new Error("Please specify an application name");
	if (!directory) directory = process.cwd();
	helpers.resize = resize;

	app.use('/' + name, express.static(directory + '/public', {
		maxAge: 120000 // 2 minutes
	}));
	app.get('/robots.txt', robots);

	console.log(helpers);
	app.set('views', directory + '/views');
	app.engine('.html', expressHandlebars({
		extname: '.html',
		helpers: helpers,
		partialsDir: [
			directory + '/views/partials',
			directory + '/bower_components'
		]
	}));
	app.set('view engine', '.html');

	app.use(flags.middleware);

	app._listen = app.listen;
	app.listen = function() {
		var args = arguments;
		app.use(errorsHandler.middleware);

		flagsPromise.then(function() {
			app._listen.apply(app, args);
		});
	};

	return app;
};
