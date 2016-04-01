include n.Makefile

test: unit-test verify

unit-test:
	export FT_NEXT_BACKEND_KEY=test-backend-key; find test -path '*.test.js' -exec mocha {} +

run:
	node test/fixtures/app/main.js

run-bad-assets:
	node test/fixtures/bad-assets/main.js
