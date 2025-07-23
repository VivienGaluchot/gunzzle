all: check test

.PHONY: check
check:
	@deno check src/gunzzle.ts
	@deno check src/test.ts

.PHONY: test
test:
	@deno test src/test.ts

.PHONY: run_cube
run_cube:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t cube -n 3

.PHONY: run_triangle4
run_triangle4:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t triangle4 -n 3

.PHONY: run_tetrahedra
run_tetrahedra:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s brute-force -d result -t tetrahedra -n 3

.PHONY: run_hexagon3
run_hexagon3:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t hexagon3 -n 3

.PHONY: run_hexagon4
run_hexagon4:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t hexagon4 -n 3

.PHONY: run_hexagon7
run_hexagon7:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t hexagon7 -n 3
