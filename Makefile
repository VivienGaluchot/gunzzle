export DENO_DIR=/home/dev/.deno

all: check test run

.PHONY: check
check:
	@deno check src/main.ts

.PHONY: test
test:
	@deno test src/main.ts

.PHONY: run
run:
	@deno run src/main.ts
