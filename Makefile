REPORTER = spec
ui = bdd
VERSION := $(shell cat package.json | grep version | grep -o -E '[0-9]+\.[0-9]+\.[0-9]+')
UNITTESTFILES := $(shell find test/unit -name '*-test.js')
INTEGRATIONTESTFILES := $(shell find test/integration -name '*-test.js')

test: test-unit
	
test-all: test-unit test-integration

test-unit:
	@./node_modules/.bin/mocha \
		--ui $(ui) \
		--reporter $(REPORTER) \
		$(UNITTESTFILES)

test-integration:
	@./node_modules/.bin/mocha \
		--ui $(ui) \
		--reporter $(REPORTER) \
		$(INTEGRATIONTESTFILES)

test-spec:
	@./node_modules/.bin/mocha \
		--ui bdd \
		--reporter spec \
		--grep "$(grep)" \
		$(UNITTESTFILES) $(INTEGRATIONTESTFILES)

release:
	git tag -a v$(VERSION) -m 'release version $(VERSION)'
	git push
	git push --tags
	npm publish .

.PHONY: test test-all test-unit test-integration