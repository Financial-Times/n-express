/**
 * @typedef {import("../../typings/n-express").AppMeta} AppMeta
 */

const normalizeName = require('./normalize-name');

/**
 * @param {AppMeta} options
 * @returns {AppMeta & {description: string}}
 */
module.exports = (options) => {
	let name = options.name;
	let description = '';
	let directory = options.directory || process.cwd();

	if (!name) {
		try {
			const packageJson = require(directory + '/package.json');
			name = packageJson.name;
			description = packageJson.description || '';
		} catch (e) {
			// Safely ignorable error
		}
	}

	if (!name) throw new Error('Please specify an application name');

	name = name && normalizeName(name);
	const systemCode = options.systemCode || options.name;

	return { name, description, directory, systemCode };
};
