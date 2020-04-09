'use strict';
//const to = require('await-to-js');
var expect = require('chai').expect;
var request = require("request");
var rp = require('axios');


describe('API', function() {
	it('myorders', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/my_orders_v2/0x66a6c15b2a6a253aa2f67ea525b2619f12ae8d3509/1/30/full_filled/partial_filled")
		const end = new Date().getTime()
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});


	it('mytrades', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/my_trades_v2/0x66a6c15b2a6a253aa2f67ea525b2619f12ae8d3509/1/30")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('mist_user_overview', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/mist_user_overview/0x66a6c15b2a6a253aa2f67ea525b2619f12ae8d3509")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('list_market_quotations', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/list_market_quotations_v2")
		const end = new Date().getTime()
		
		expect(result.data.result.length).to.not.equal(0)
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('get_token_price', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/get_token_price_v2/BTC")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('balances', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/balances_v2?address=0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
	});

	it('asset_balances', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/asset_balances/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('erc20_balances', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/erc20_balances/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('get_order_id', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/get_order_id_v2/0x66a9ae316e1914dc8d835d5cd2ed57ab24b52a02c7/ASIM-CNYC/sell/100/6000")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});
/*
	it('build_order', async() =>{

		var options = {
			method: 'POST',
			uri: 'http://119.23.181.166:21000/adex/build_order_v3',
			body: {
			signature:{
					r: '19e54db2a1871c6ea22f4b195598a3f368c5d7b6dd65e89deeb764ccc5782d73',
					s: '13f2bb87c30fb3967ee0607a4acb1c42df988c4601bd0b920736da85fdea04e4',
					pubkey: '037cfb1769aa470e139c30f8cfd17d47f44e5317ad7f5b6e31e358d1e6e3df2832'
			 },
			 trader_address:'0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9',
			 market_id:'ASIM-CNYC',
			 side:'sell',
			 price:10000,
			 amount:6,
			 order_id:'2bc97051c8e0693d03fb5fe27430bead5a11ea4047e07abba162b4a83807118e'
			},
			json: true // Automatically stringifies the body to JSON
		};
		const start = new Date().getTime()
		let result = await rp(options)
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(3000)
		
	});/

	it('cancle_orders', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(3000)
		
	});
*/
	it('my_orders', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/my_orders_v2/0x6622bd37c1331b34359920f1eaa18a38ba9ff203e9/1/1/pending/fullfuilled")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('my_trades', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/my_trades_v2/0x6622bd37c1331b34359920f1eaa18a38ba9ff203e9/1/1")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});
/*
	it('asset2coin_v3', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(3000)
		
	});

	it('coin2asset_v3', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/adex/")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(3000)
		
	});
*/
	it('burn_coin_tohex', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/wallet/burn_coin_tohex/0x66c16d217ce654c5ebbdcb1f978ef2dee7ec444ada/CNYC/1")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('find_convert', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/wallet/find_convert/8c4ddabebe95718a37aea074120d3bd133196c01812935ddef42dffcdfd431ac")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('my_converts', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/wallet/my_converts_v3/0x6602ca6e2820ec98cc68909fdd9f87c7bd23b62000/ASIM/1/10")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('coin2asset_fee_config', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/wallet/coin2asset_fee_config")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('list_fingo_config', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/wallet/list_fingo_config")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('my_express_records', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/express/my_records/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/3")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('get_express_trade', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/express/get_express_trade/4e6b881de2eb3b9e8bdb4baefac9d5182c54eb274c821ca43e04301c9a7e2497")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});


	it('express_config', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/express/config")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});


	it('get_express_price', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/express/get_price/ASIM/CNYC/1")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

	it('get_pool_info', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/express/get_pool_info")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});
/*
	it('build_express', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://119.23.181.166:21000/express/")
		const end = new Date().getTime()
		
		expect(result.data.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(3000)
		
	});
*/
})
