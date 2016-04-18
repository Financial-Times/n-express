.PHONY: test

clean:
	git clean -fxd

install:
	@echo already installed

test: unit-test verify

verify:
	nbt verify --skip-layout-checks --skip-dotenv-check

unit-test:
	export FT_NEXT_BACKEND_KEY=test-backend-key; mocha --recursive

run:
	node test/fixtures/app/main.js
