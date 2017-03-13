include n.Makefile

test:
	make verify
ifneq ($(CIRCLECI),)
ifeq ($(CIRCLE_TAG),)
	make coverage-report && cat ./coverage/lcov.info | ./node_modules/.bin/coveralls
else
	make unit-test
endif
else
	make unit-test
endif

coverage-report: ## coverage-report: Run the unit tests with code coverage enabled.
	unset FT_NEXT_BACKEND_KEY && istanbul cover node_modules/.bin/_mocha --report=$(if $(CIRCLECI),lcovonly,lcov) 'test/**/*.test.js'

unit-test:
	unset FT_NEXT_BACKEND_KEY && mocha test/**/*.test.js

run:
	node test/fixtures/app/main.js


