const AWS = require('aws-sdk');

const INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

let inUseExpiredKey = false;
let notInUserExpiredKey = false;
let lastUpdated = null;

function checkAwsKeys () {

	const secretKeyNames = [];
	lastUpdated = new Date().toISOString();

	Object.keys(process.env).forEach(keyName => {
		const keyValue = process.env[keyName];

		if (/^[A-Za-z0-9/\\\\+=]{40}$/.test(keyValue)) {
			secretKeyNames.push(keyName);
		}
	});

	const awsKeyPairs = [];

	Object.keys(process.env).forEach(keyName => {
		const keyValue = process.env[keyName];

		if (/[A-Z0-9]{20}/.test(keyValue)) {
			const prefixMatch = keyName.match(/^([^_]+)[A-Za-z0-9_]+$/);
			if (prefixMatch) {
				const namePrefix = prefixMatch[1];
				let secretKeyName;

				secretKeyNames.forEach(keyName2 => {
					if (!secretKeyName && keyName !== keyName2) {
						if (new RegExp('^' + namePrefix + '_[A-Za-z0-9_]+').test(keyName2)) {
							secretKeyName = keyName2;
						}
					}
				});

				if (secretKeyName) {
					const secretKeyValue = process.env[secretKeyName];

					awsKeyPairs.push({
						accessKey: keyValue,
						secretKey: secretKeyValue
					});
				}
			}
		}
	});

	awsKeyPairs.forEach(keyPair => {
		const iam = new AWS.IAM({
			accessKeyId: keyPair.accessKey,
			secretAccessKey: keyPair.secretKey
		});

		iam.listAccessKeys({}, (err, data) => {
			if (!err) {
				if (data && data.AccessKeyMetadata) {
					data.AccessKeyMetadata.forEach(keyMetadata => {
						if (keyMetadata.Status === 'Active'/* maybe remove */ && new Date().getTime() - new Date(keyMetadata.CreateDate).getTime() > 90 * 24 * 60 * 60 * 1000) {
							if (keyMetadata.AccessKeyId === keyPair.accessKey) {
								inUseExpiredKey = true;
							} else {
								notInUserExpiredKey = true;
							}
						}
					});
				}
			}
		});
	});
}


function inUse () {
	return {
		getStatus: () => ({
			name: 'All AWS keys in use are active and within the rotation period',
			ok: !inUseExpiredKey,
			businessImpact: 'Can not authenticate with AWS',
			lastUpdated,
			severity: 2,
			technicalSummary: 'AWS keys in use are active and within the rotation period',
			checkOutput: 'AWS keys in use are active and within the rotation period',
			panicGuide: 'Follow the runbooks, do usual diagnosis and escalate as appropriate'
		})
	};
}

function notInUse () {
	return {
		getStatus: () => ({
			name: 'All AWS keys not in use are active and within the rotation period',
			ok: !notInUserExpiredKey,
			businessImpact: 'Can not authenticate with AWS',
			lastUpdated,
			severity: 2,
			technicalSummary: 'AWS keys not in use are active and within the rotation period',
			checkOutput: 'AWS keys not in use are active and within the rotation period',
			panicGuide: 'Follow the runbooks, do usual diagnosis and escalate as appropriate'
		})
	};
}

module.exports = {
	init: function () {
		checkAwsKeys();
		setInterval(checkAwsKeys, INTERVAL);

	},
	checks: [
		inUse(),
		notInUse()
	]
};
