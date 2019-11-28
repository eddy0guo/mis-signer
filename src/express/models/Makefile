rmdb:
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./light.down.sql
initdb: rmdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./light.up.sql
seed: initdb
	psql postgres://postgres:postgres@localhost:5432/${MIST_MODE}?sslmode=disable < ./seed.sql

