'use strict';

const nUi = require('@financial-times/n-ui');
const headCssMiddleware = require('../middleware/head-css');
const verifyAssetsExist = require('./verify-assets-exist');
const denodeify = require('denodeify');

module.exports = function (app, options, directory) {
	verifyAssetsExist.verify(app.locals);

	if (options.hasNUiBundle) {
		if (!options.withFlags) {
			throw new Error('To use n-ui bundle please also enable flags by passing in `withFlags: true` as an option to n-express');
		}
		app.use(nUi.middleware);
	}

	// get head css
	const readFile = denodeify(require('fs').readFile);
	const headCssPromise = options.hasHeadCss ? readFile(directory + '/public/head.css', 'utf-8') : Promise.resolve();
	app.use(headCssMiddleware(headCssPromise));

	return headCssPromise;
}
