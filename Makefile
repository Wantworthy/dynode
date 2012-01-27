REPORTER = spec
ui = bdd
VERSION := $(shell cat package.json | grep version | grep -o '[0-9]\.[0-9]\.[0-9]')

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
		test/unit/*-test.js test/integration/*-test.js

release:
	git tag -a v$(VERSION) -m 'release version $(VERSION)'
	git push
	git push --tags
	npm publish .

.PHONY: test test-all test-unit test-integration