.PHONY: test

clean:
	git clean -fxd

install:
	npm install origami-build-tools
	obt install --verbose

test:
	nbt verify --skip-layout-checks
	mocha

run:
	node test/fixtures/app/main.js
