rmdb:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./0001-init.down.sql
initdb: rmdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./0001-init.up.sql
seed: initdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./seed.sql
hqtn_seed: initdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./hqtn_seed.sql
hqpd_seed: initdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./hqtn_seed.sql
test:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./test.sql
cdp_seed: borrow_up
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./cdp_seed.sql
hqtn_cdp_seed: borrow_up
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./hqtn_cdp_seed.sql
hqpd_cdp_seed: borrow_up
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./hqtn_cdp_seed.sql
borrow_up: borrow_down
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./borrow.up.sql
borrow_down:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./borrow.down.sql
clean:
	go clean

.PHONY: test api ws watcher engine launcher
