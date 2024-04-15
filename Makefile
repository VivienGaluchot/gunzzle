all: check test run

.PHONY: check
check:
	@deno check src/cube.ts
	@deno check src/test.ts

.PHONY: test
test:
	@deno test src/test.ts

.PHONY: run
run:
	@deno run src/cube.ts
