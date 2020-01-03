import DB from '../src/adex/models/db'
const db = new DB()

test('adds 1 + 2 to equal 3', async() => {
    const filter = [3000, 'buy', 'BTC-USDT'];
    const start = new Date().getTime()
    const result = await db.filter_orders(filter);
    const end = new Date().getTime()
    expect(result).toBeDefined()
    expect(end-start).toBeGreaterThen(1000)
});