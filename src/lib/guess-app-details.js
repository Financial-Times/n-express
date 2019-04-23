const normalizeName = require('./normalize-name');

module.exports = options => {
	let packageJson = {};
	let name = options.name;
	let description = '';
	let directory = options.directory || process.cwd();

	if (!name) {
		try {
			packageJson = require(directory + '/package.json');
			name = packageJson.name;
			description = packageJson.description || '';
		} catch(e) {
			// Safely ignorable error
		}
	}

	if (!name) throw new Error('Please specify an application name');

	name = name && normalizeName(name);
	let systemCode = options.systemCode ? options.systemCode : options.name;

	return {name, description, directory, systemCode};
};
