'use strict';
//const to = require('await-to-js');
const {Pool} = require('postgres-pool');
var expect = require('chai').expect;

const db = new Pool({
    host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
    database: 'product',
    user: 'product',
    password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
    port: 1433,
});

describe('SQL', function() {

	it('SQL Test Match Order', async() =>{
		const filter = [3000, 'buy', 'BTC-USDT'];
		const start = new Date().getTime()
		let result = await db.query('SELECT * FROM mist_orders_tmp where price<=$1 and side=$2 and available_amount>0 and market_id=$3 order by price asc limit 10',filter);
		const end = new Date().getTime()
		expect(result.rows.length).to.be.equal(10);
		expect(end-start).to.be.lessThan(300)

	});

	it('SQL Test Orderbook', async() =>{
		const filter = ['buy', 'BTC-USDT'];
		const start = new Date().getTime()
		let result = await db.query('SELECT price,sum(available_amount) FROM mist_orders_tmp where side=$1 and available_amount>0 and market_id=$2 group by price order by price limit 10',filter);
		const end = new Date().getTime()
		expect(result.rows.length).to.be.equal(10);
		expect(end-start).to.be.lessThan(300)
	});

})
