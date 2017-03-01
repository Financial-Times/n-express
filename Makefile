include n.Makefile

test:
	make verify
ifeq ($(CIRCLECI),true)
	make coverage-report && cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
else
	make unit-test
endif
	make auth-test

coverage-report: ## coverage-report: Run the unit tests with code coverage enabled.
	unset FT_NEXT_BACKEND_KEY && istanbul cover node_modules/.bin/_mocha --report=$(if $(CIRCLECI),lcovonly,lcov) 'test/**/*.test.js'

unit-test:
	unset FT_NEXT_BACKEND_KEY && mocha test/**/*.test.js

run:
	node test/fixtures/app/main.js

run-bad-assets:
	node test/fixtures/bad-assets/main.js

fixtures:
	curl http://ft-next-navigation.s3-website-eu-west-1.amazonaws.com/json/lists.json > test/fixtures/navigationLists.json
