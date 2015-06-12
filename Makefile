.PHONY: test

clean:
	git clean -fxd

install:
	npm install origami-build-tools
	obt install --verbose

test: verify unit-test

verify:
	nbt verify --skip-layout-checks

unit-test:
	mocha --recursive

run:
	node test/fixtures/app/main.js

check:
	npm-check-updates
