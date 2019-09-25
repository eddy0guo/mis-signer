rmdb:
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./0001-init.down.sql

initdb: rmdb
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./0001-init.up.sql

seed: initdb
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./seed.sql

test:
	psql postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable < ./test.sql

clean:
	go clean

.PHONY: test api ws watcher engine launcher
