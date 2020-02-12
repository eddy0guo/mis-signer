'use strict';
//const to = require('await-to-js');
var expect = require('chai').expect;
var request = require("request");
var rp = require('request-promise');


describe('API', function() {

	it('myorders', async() =>{
		const start = new Date().getTime()
		let result = await rp("http://127.0.0.1:21000/adex/my_orders_v2/0x66a6c15b2a6a253aa2f67ea525b2619f12ae8d3509/1/30/full_filled/partial_filled")
		const end = new Date().getTime()
		result = JSON.parse(result);
		expect(result.success).to.be.equal(true);
		expect(end-start).to.be.lessThan(300)
		
	});

})
