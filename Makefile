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
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t triangle4 -n 2


.PHONY: run_tetraedre
run_tetraedre:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s brute-force -d result -t tetrahedra -n 3

.PHONY: run_hexagone3
run_hexagone3:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t hexagon3 -n 3

.PHONY: run_hexagone4
run_hexagone4:
	@mkdir -p result
	@deno run --allow-write src/gunzzle.ts -s darwin -d result -t hexagon4 -n 3
