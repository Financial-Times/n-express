.PHONY: test

install:
	npm install

test:
	mocha

demo:
	node test/fixtures/app/main.js
