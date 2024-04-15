export DENO_DIR=/home/dev/.deno

DENO=/home/dev/.deno/bin/deno

all: check test run

.PHONY: check
check:
	@${DENO} check src/cube.ts
	@${DENO} check src/test.ts

.PHONY: test
test:
	@${DENO} test src/test.ts

.PHONY: run
run:
	@${DENO} run src/cube.ts
