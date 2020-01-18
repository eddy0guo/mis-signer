rmdb:
	psql "host=pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com port=1433 dbname=${MIST_MODE} user=product password=myHzSesQc7TXSS5HOXZDsgq7SNUHY2" < ./${MIST_MODE}_conf/0001-init.down.sql
initdb: rmdb
	psql "host=pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com port=1433 dbname=${MIST_MODE} user=product password=myHzSesQc7TXSS5HOXZDsgq7SNUHY2" < ./${MIST_MODE}_conf/0001-init.up.sql
seed: initdb
	psql "host=pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com port=1433 dbname=${MIST_MODE} user=product password=myHzSesQc7TXSS5HOXZDsgq7SNUHY2" < ./${MIST_MODE}_conf/seed.sql
