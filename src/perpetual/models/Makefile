rmdb:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/0001-init.down.sql
initdb: rmdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/0001-init.up.sql
seed: initdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./${MIST_MODE}_conf/seed.sql
clean:
	go clean

.PHONY: test api ws watcher engine launcher
