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
	export FT_NEXT_BACKEND_KEY=test-backend-key; mocha --recursive

run:
	node test/fixtures/app/main.js

release-patch:
	npm version patch
	npm publish
	git push && git push --tags

release-minor:
	npm version minor
	npm publish
	git push && git push --tags

release-major:
	npm version major
	npm publish
	git push && git push --tags
