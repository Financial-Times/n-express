const semver = require('semver');

// Ref. https://nodejs.org/en/about/releases

/**
 * @type {Object.<string, Date>}
 */
const nodeVersionToEndOfLifeDateMap = {
	'12': new Date('2022-04-30'),
	'14': new Date('2023-04-30'),
	'16': new Date('2023-09-11'),
	'18': new Date('2025-04-30'),
	'20': new Date('2026-04-30'),
	'22': new Date('2027-04-30')
};

/**
 * @param {string} appName
 * @returns {import("../../typings/metrics").Healthcheck}
 */
module.exports = (appName) => {
	const lastUpdated = new Date();

	const currentDate = new Date();

	const region = process.env.REGION === 'US' ? 'us' : 'eu';

	const nodeVersion = process.versions.node;

	const nodeMajorVersion = semver.major(nodeVersion);

	const hasSupportedVersion = nodeVersionToEndOfLifeDateMap[nodeMajorVersion] > currentDate;

	return {
		getStatus: () => {
			return {
				id: `supported-node-js-version-${region}`,
				name: `Long-term supported (LTS) Node.js version used for ${appName} (${region.toUpperCase()})`,
				ok: hasSupportedVersion,
				checkOutput: hasSupportedVersion
					? `${appName} uses v${nodeVersion} of Node.js, which is a long-term supported (LTS) version`
					: `${appName} uses v${nodeVersion} of Node.js, which is not a long-term supported (LTS) version`,
				lastUpdated,
				severity: 3,
				businessImpact: 'Systems may be subject to security and/or functional bugs that will not be fixed and which could manifest in various ways.',
				technicalSummary: 'Inspects the version of Node.js running the application and verifies that the end-of-life date for it has not passed.',
				panicGuide: 'Upgrade the app to a long-term supported version of Node.js at your earliest convenience.'
			};
		}
	};
};
