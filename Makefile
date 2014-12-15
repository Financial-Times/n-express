.PHONY: test

install:
	npm install

test:
	mocha

run:
	node test/fixtures/app/main.js
