.PHONY: test

install:
	npm install

test:
	export HOSTEDGRAPHITE_APIKEY=123; mocha

run:
	export HOSTEDGRAPHITE_APIKEY=123; node test/fixtures/app/main.js
