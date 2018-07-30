module.exports = {
	files: {
		allow: [
			'cert.pem',
			'key.pem',
			'src/assets/robots.txt',
			'src/assets/teapot.ascii'
		],
		allowOverrides: []
	},
	strings: {
		deny: [],
		denyOverrides: [
			'dWcviesUB03w7mltofQp7fiOpPkzoNyI', // cert.pem:12
			'g1Lz9joDwspGf9NmymwGWZTWm1YnDMNAJsvDMBFs', // cert.pem:13|13
			'9S5AYP21OmG2Ed45\\+MCf5PJSGjevnc7aqvg8rGp\\+', // cert.pem:16
			'Obukg5ifDAUyHBkItzGbc', // cert.pem:18
			'2bWCDsmgyILTIL2ejjfZz79JmWr28\\+U/FQOJSqEb', // key.pem:3
			'HTfDuaW2h9Cnt\\+I6k\\+TOg3Ij5vbh/rxNLwTQmzOW', // key.pem:5
			'/V5CwimQKBgB\\+F8ywd5zQhrTZzz7M6ARUQP7j9b/', // key.pem:21
			'wvvSnjBi0lHELEhDDEjdH/IDrumlgykr4aRa4Guw', // key.pem:22
			'RHWRFPG6rVH1YDP7xIX0q', // key.pem:22
			'/AoGAEVfE\\+pHlAlbEo\\+DtbRcig4qmf1Ja\\+kX7dwI', // key.pem:24
			'/document/d/1bILX3O37XmhKOtpWvox9BeZ6RW4' // src/lib/aws-keys-healthcheck.js:104|121
		]
	}
};
