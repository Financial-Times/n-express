node_modules/@financial-times/n-gage/index.mk:
	npm install @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

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
	unset FT_NEXT_BACKEND_KEY && FT_GRAPHITE_KEY=foobar istanbul cover node_modules/.bin/_mocha --report=$(if $(CIRCLECI),lcovonly,lcov) 'test/**/*.test.js'

## configure unit test to run app.test.js with --no-exit, to demonstrate the tests stop hanging by calling app.close()
unit-test:
	unset FT_NEXT_BACKEND_KEY && export FT_GRAPHITE_KEY=foobar && mocha --no-exit test/app/app.test.js && mocha --exit test/**/*.test.js --exclude test/app/app.test.js

run:
	node test/fixtures/app/main.js
