all: check test run

.PHONY: check
check:
	@deno check src/gunzzle.ts
	@deno check src/test.ts

.PHONY: test
test:
	@deno test src/test.ts

.PHONY: run
run:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result
