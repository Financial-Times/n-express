const AWS = require('aws-sdk');

const INTERVAL = 15 * 60 * 1000;

let inUseExpiredKey = false;
let notInUserExpiredKey = false;

function checkAwsKeys () {

	const secretKeyNames = [];
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
			name: 'In use AWS expired keys',
			ok: !inUseExpiredKey,
			businessImpact: 'Can not authenticate with AWS',
			severity: 2,
			technicalSummary: 'AWS expired keys',
			panicGuide: 'Follow the runbooks, do usual diagnosis and escalate as appropriate'
		})
	};
}

function notInUse () {
	return {
		getStatus: () => ({
			name: 'Not in use AWS expired keys',
			ok: !notInUserExpiredKey,
			businessImpact: 'Can not authenticate with AWS',
			severity: 2,
			technicalSummary: 'AWS expired keys',
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
