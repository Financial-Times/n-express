.PHONY: test

clean:
	git clean -fxd

install:
	npm install origami-build-tools
	obt install --verbose

test: unit-test
	nbt verify --skip-layout-checks

unit-test:
	mocha --recursive

run:
	node test/fixtures/app/main.js
