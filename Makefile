.PHONY: test

install:
	npm install

test:
	next-build-tools verify
	mocha

run:
	node test/fixtures/app/main.js
