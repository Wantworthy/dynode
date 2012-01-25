REPORTER = spec
ui = bdd

test: test-unit
	
test-all: test-unit test-integration

test-unit:
	@./node_modules/.bin/mocha \
		--ui $(ui) \
		--reporter $(REPORTER) \
		--require should \
		test/unit/*-test.js

test-integration:
	@./node_modules/.bin/mocha \
		--ui $(ui) \
		--reporter $(REPORTER) \
		--require should \
		test/integration/*-test.js

test-spec:
	@./node_modules/.bin/mocha \
		--ui bdd \
		--reporter spec \
		--require should \
		--grep "$(grep)" \
		test/unit/*-test.js

.PHONY: test test-all test-unit test-integration
