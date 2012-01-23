test:
	@./node_modules/.bin/mocha \
		--ui bdd \
		--reporter spec \
		--require should \
		test/*-test.js

test-spec:
	@./node_modules/.bin/mocha \
		--ui bdd \
		--reporter spec \
		--require should \
		--grep "$(grep)" \
		test/*-test.js

.PHONY: test
