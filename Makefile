include n.Makefile

test: test-unit verify

test-unit: export FT_NEXT_BACKEND_KEY=test-backend-key
test-unit: export FT_NEXT_BACKEND_KEY_OLD=test-backend-key-old
test-unit: export FT_NEXT_BACKEND_KEY_OLDEST=test-backend-key-oldest
test-unit:
	find test -path '*.test.js' -exec mocha {} +

run:
	node test/fixtures/app/main.js

run-bad-assets:
	node test/fixtures/bad-assets/main.js
