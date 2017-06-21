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
			// all these up to END are in the .pem files
			'dWcviesUB03w7mltofQp7fiOpPkzoNyI',
			'g1Lz9joDwspGf9NmymwGWZTWm1YnDMNAJsvDMBFs',
			'9S5AYP21OmG2Ed45\\+MCf5PJSGjevnc7aqvg8rGp\\+',
			'Obukg5ifDAUyHBkItzGbc',
			'2bWCDsmgyILTIL2ejjfZz79JmWr28\\+U/FQOJSqEb',
			'HTfDuaW2h9Cnt\\+I6k\\+TOg3Ij5vbh/rxNLwTQmzOW',
			'/V5CwimQKBgB\\+F8ywd5zQhrTZzz7M6ARUQP7j9b/',
			'wvvSnjBi0lHELEhDDEjdH/IDrumlgykr4aRa4Guw',
			'RHWRFPG6rVH1YDP7xIX0q',
			'/AoGAEVfE\\+pHlAlbEo\\+DtbRcig4qmf1Ja\\+kX7dwI'
			// END
		]
	}
};
