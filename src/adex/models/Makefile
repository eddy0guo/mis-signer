rmdb:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/0001-init.down.sql
initdb: rmdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/0001-init.up.sql
seed: initdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/seed.sql
cdp_seed: borrow_up
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/cdp_seed.sql
borrow_up: borrow_down
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/borrow.up.sql
borrow_down:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/borrow.down.sql
clean:
	go clean

.PHONY: test api ws watcher engine launcher
