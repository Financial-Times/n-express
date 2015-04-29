.PHONY: test

clean:
	next-build-tools clean

install:
	npm install

test:
	next-build-tools verify
	mocha

run:
	node test/fixtures/app/main.js
