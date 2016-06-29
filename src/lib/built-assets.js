'use strict';

const nUi = require('@financial-times/n-ui');
const denodeify = require('denodeify');
const fs = require('fs');

const headCssMiddleware = require('../middleware/head-css');
const verifyAssetsExist = require('./verify-assets-exist');

module.exports = function (app, options, directory) {
	verifyAssetsExist.verify(app.locals);

	if (options.hasNUiBundle) {
		if (!options.withFlags) {
			throw new Error('To use n-ui bundle please also enable flags by passing in `withFlags: true` as an option to n-express');
		}
		app.use(nUi.middleware);
	}

	// get head css(es)
	const readDir = denodeify(fs.readdir);
	const readFile = denodeify(fs.readFile);
	const headCssPromise = options.hasHeadCss ?
		readDir(`${directory}/public`)
			.then(files =>
				Promise.all(
					files
						.filter(filename => /^head[\-a-z]*\.css$/.test(filename))
						.map(headFilename =>
							readFile(`${directory}/public/${headFilename}`, 'utf-8')
								.then(data => [headFilename.replace('.css', ''), data])
						)
				)
			)
			.then(headCsses =>
				// turn the array of arrays into an object, key the filename, value the data
				headCsses.reduce((currentHeadCsses, currentHeadCss) => {
					currentHeadCsses[currentHeadCss[0]] = currentHeadCss[1];
					return currentHeadCsses;
				}, {})
			) :
		Promise.resolve([]);

	app.use(headCssMiddleware(headCssPromise));

	return headCssPromise;
};
