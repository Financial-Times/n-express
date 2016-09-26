include n.Makefile

test: unit-test verify

unit-test: export FT_NEXT_BACKEND_KEY=test-backend-key
unit-test: export FT_NEXT_BACKEND_KEY_OLD=test-backend-key-old
unit-test: export FT_NEXT_BACKEND_KEY_OLDEST=test-backend-key-oldest
unit-test:
	mocha test/**/*.test.js --recursive

run:
	node test/fixtures/app/main.js

run-bad-assets:
	node test/fixtures/bad-assets/main.js

fixtures:
	curl http://ft-next-navigation.s3-website-eu-west-1.amazonaws.com/json/lists.json > test/fixtures/navigationLists.json
