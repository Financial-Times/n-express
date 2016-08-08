'use strict';

const fs = require('fs');

module.exports = function (options, directory) {

	const headCsses = options.hasHeadCss ? fs.readdirSync(`${directory}/public`)
		.filter(name => /^head[\-a-z]*\.css$/.test(name))
		.map(name => [name, fs.readFileSync(`${directory}/public/${name}`, 'utf-8')])
		.reduce((currentHeadCsses, currentHeadCss) => {
			currentHeadCsses[currentHeadCss[0].replace('.css', '')] = currentHeadCss[1];
			return currentHeadCsses;
		}, {}) : {};

	return (req, res, next) => {
		res.locals.headCsses = headCsses;
		next();
	};
};
