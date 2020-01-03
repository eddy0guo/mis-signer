import { Pool } from 'postgres-pool'
import to from 'await-to-js'

const db = new Pool({
    host: 'mist.exchange',
    database: 'product',
    user: 'postgres',
    password: 'postgres',
    port: 5432,
});

test('SQL Test Match Order', async() => {
    const filter = [3000, 'buy', 'BTC-USDT'];
    const start = new Date().getTime()
    let [err,result] = await to(db.query('SELECT * FROM mist_orders where price<=$1 and side=$2 and available_amount>0 and market_id=$3 order by price asc limit 1000',filter));
    const end = new Date().getTime()
    expect(err).toBeNull()
    expect(result).toBeDefined()
    expect(end-start).toBeLessThan(1000)
});

test('SQL Test Orderbook', async() => {
    const filter = ['buy', 'BTC-USDT'];
    const start = new Date().getTime()
    let [err,result] = await to(db.query('SELECT price,sum(available_amount) FROM mist_orders where side=$1 and available_amount>0 and market_id=$2 group by price order by price limit 99',filter));
    const end = new Date().getTime()
    expect(err).toBeNull()
    expect(result).toBeDefined()
    expect(result.rows.length).toBeLessThan(100)
    expect(end-start).toBeLessThan(300)
});