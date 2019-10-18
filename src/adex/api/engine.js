import to from 'await-to-js'
import TokenTest from '../../wallet/contract/TokenTest'
import walletHelper from '../../wallet/lib/walletHelper'
import mist_ex  from '../../wallet/contract/mist_ex'
import mist_ex10  from '../../wallet/contract/mist_ex10'
import utils2 from './utils'
var date = require("silly-datetime");
var index = require("../index");


var ex_address = '0x63d2007ae83b2853d85c5bd556197e09ca4d52d9c9';
var ex10_address = '0x63f2e35430d95ae63d63f8d115c95ffc9ff5b3d68e';
let walletInst;
async function getTestInst(){
	if( walletInst ) return walletInst;
	//relayer words
	walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
		return walletInst
}


export default class engine{
	db;
	constructor(client) { 
		this.db = client;
		this.utils = new utils2;
	}


	async match(message) {
		let side =  "buy"; 
		if (message.side == "buy"){
			side = "sell"
		}

		let filter = [message.price,side,message.market_id];

		let result = await this.db.filter_orders(filter); 

		let match_orders =[];
		let amount = 0;
		//find and retunr。all orders。which's price below this order
		//下单量大于匹配的总额或者或者下单量小于匹配的总额，全部成交 
		console.log("gxy44444555----length",result.length);
		for (var i = 0;i<result.length ;i++){

			//返回的字面量用+处理成数值
			result[i].amount = +result[i].amount;
			result[i].available_amount = +result[i].available_amount;
			match_orders.push(result[i]);
			amount += result[i].amount;  
			if (amount >= message.amount){

				break;
			}

		}

		return match_orders;
	}

	async make_trades(find_orders,my_order){
		//       var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss'); 
		let create_time = this.utils.get_current_time();
		let trade_arr = [];
		let amount=0;
		for(var item = 0; item < find_orders.length;item++){

			//partial_filled,pending,full_filled,默认吃单有剩余，挂单吃完
			let maker_status = 'full_filled'; 

			//最低价格的一单最后成交，成交数量按照吃单剩下的额度成交,并且更新最后一个order的可用余额fixme__gxy
			amount += find_orders[item].available_amount;


			//吃单全部成交,挂单有剩余的场景,
			if(item == find_orders.length - 1 && amount > my_order.amount ){

				find_orders[item].available_amount -= (amount - my_order.amount);
				maker_status = 'partial_filled';
			}

			console.log("gxyyy--available_amount-333-", find_orders[item].available_amount,my_order.amount );
			let trade={
id:               null,
				  transaction_id:   null,
				  transaction_hash: null,
				  status:           "pending",
				  market_id:        my_order.market_id,
				  maker:            find_orders[item].trader_address,
				  taker:            my_order.trader_address,
				  price:            find_orders[item].price,
				  amount:           find_orders[item].available_amount,
				  taker_side:       find_orders[item].side,
				  maker_order_id:   find_orders[item].id,
				  taker_order_id:   my_order.id,
				  created_at:       create_time,
				  updated_at:       create_time
			};

			let trade_id = this.utils.get_hash(trade);
			trade.id = trade_id;
			//插入trades表_  fixme__gxy        
			trade_arr.push(trade);
			//匹配订单后，同时更新taker和maker的order信息,先不做错误处理,买单和卖单的计算逻辑是相同的,只需要更新available和pending
			//此更新逻辑适用于全部成交和部分成交的两种情况
			//available_amount,confirmed_amount,canceled_amount,pending_amount


			let update_maker_orders_info = [-find_orders[item].available_amount,0,0,find_orders[item].available_amount,maker_status,create_time,find_orders[item].id];
			//	  let update_taker_orders_info = [-find_orders[item].available_amount,0,0,find_orders[item].available_amount,taker_status,create_time,my_order.id];

			await this.db.update_orders(update_maker_orders_info);
			//	  await this.db.update_orders(update_taker_orders_info);
			//  await this.db.insert_trades(this.utils.arr_values(trade));

		}

		return trade_arr;

	}

	async call_asimov(trades) {
		let mist  = new mist_ex10(ex10_address);
		walletInst = await getTestInst();

		console.log("dex_match_order----gxy---22",trades);
		let token_address = await this.db.get_market([trades[0].market_id]);
		console.log("dex_match_order----gxy---333333",token_address[0].base_token_address,token_address[0].quote_token_address);

		//这里合约逻辑写反了。参数顺序也故意写反，使整体没问题，等下次合约更新调整过来，fixme
		//let order_address_set = [token_address[0].base_token_address,token_address[0].quote_token_address,index.relayer];
		let order_address_set = [token_address[0].quote_token_address,token_address[0].base_token_address,index.relayer];

		mist.unlock(walletInst,"111111");

		//结构体数组转换成二维数组,代币精度目前写死为7,18的会报错和合约类型u256不匹配
		let trades_info  =[];
		let trades_hash  =[];
		for(var i in trades){
			let trade_info = [
				trades[i].taker,
				trades[i].maker,
				order_address_set[0],
				order_address_set[1],
				order_address_set[2],
				trades[i].amount *  trades[i].price,  //    uint256 baseTokenAmount;
				trades[i].amount,  // quoteTokenAmount;
				//   10,  //    uint256 baseTokenAmount;
				//   5,  // quoteTokenAmount;
				trades[i].taker_side
			];


				let [err4,result4] = await to(walletInst.queryAllBalance());
				//后边改合约传结构体数据
				let [err33,trade_hash] = await to(mist.orderhash(trade_info));
				console.log("33333333order_hash-------",order_hash,err33);
					trades_info.push(trade_info);
					trades_hash.push(trade_hash);
		}

		//更新utxo的操作放在打包交易之前，不然部分时候还是出现没更新的情况
		let [err2,result] = await to(walletInst.queryAllBalance());
		console.log("gxy---engine-call_asimov_result2222 = -",result,err2);

	//	let [err,txid] = await to(mist.dex_match_order(trades_info,order_address_set));
		let [err,txid] = await to(mist.matchorder(trades_info,order_address_set,trades_hash));


		console.log("gxy---engine-call_asimov_result = -",txid,err);

		return txid;
	}


}
