rmdb:
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./0001-init.down.sql

initdb: rmdb
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./0001-init.up.sql

seed: initdb
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./seed.sql

test:
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./test.sql

cdp_seed: borrow_up
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./cdp_seed.sql
borrow_up: borrow_down
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./borrow.up.sql
borrow_down:
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./borrow.down.sql
clean:
	go clean

.PHONY: test api ws watcher engine launcher
