.PHONY: test

clean:
	git clean -fxd

install:
	npm install origami-build-tools
	obt install --verbose

test: verify unit-test

verify:
	nbt verify --skip-layout-checks --skip-dotenv-check

unit-test:
	export BEACON_API_URL=blah; \
	mocha --recursive

run:
	export BEACON_API_URL=blah; \
	node test/fixtures/app/main.js

check:
	npm-check-updates
