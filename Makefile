include n.Makefile

test: unit-test auth-test verify

unit-test:
	unset FT_NEXT_BACKEND_KEY && mocha test/**/*.test.js --recursive

auth-test: export FT_NEXT_BACKEND_KEY=test-backend-key
auth-test: export FT_NEXT_BACKEND_KEY_OLD=test-backend-key-old
auth-test: export DISABLE_FLAGS=true
auth-test:
	mocha test/**/backend-auth.test.js --recursive


run:
	node test/fixtures/app/main.js

run-bad-assets:
	node test/fixtures/bad-assets/main.js

fixtures:
	curl http://ft-next-navigation.s3-website-eu-west-1.amazonaws.com/json/lists.json > test/fixtures/navigationLists.json
