import to from 'await-to-js'
import TokenTest from '../../wallet/contract/TokenTest'
import walletHelper from '../../wallet/lib/walletHelper'
import mist_ex  from '../../wallet/contract/mist_ex'
import utils2 from './utils'
var date = require("silly-datetime");
var index = require("../index");


var ex_address = '0x63d2007ae83b2853d85c5bd556197e09ca4d52d9c9';
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
                let type =  "buy"; 
                if (message.side == "buy"){
                        type = "sell"
                }

                let filter = [message.price,type];

                let result = await this.db.filter_orders(filter); 

                console.log("gxy4444444444----",result);
                let match_orders =[];
                let amount = 0;
                //find and retunr。all orders。which's price below this order
                //下单量大于匹配的总额或者或者下单量小于匹配的总额，全部成交 
                console.log("gxy44444555----length",result.length);
                for (var i = 0;i<result.length ;i++){

                    //返回的字面量用+处理成数值
                    result[i].amount = +result[i].amount;
                    match_orders.push(result[i]);
                    amount += result[i].amount;  
                    if (amount >= message.amount){
                        
                        break;
                    }

                }
                //没有吃完订单，更新order的可用余额,fixme_gxy
                if(message.amount > amount){
                       
                    console.log("gxy44-The remaining amount = --",message.amount = amount);
                }

                return match_orders;
        }
        
        async make_trades(find_orders,my_order){
                 var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss'); 
                let trade_arr = [];
                let amount=0;
                for(var item = 0; item < find_orders.length;item++){
                    
                    //最低价格的一单最后成交，成交数量按照吃单剩下的额度成交,并且更新最后一个order的可用余额fixme__gxy
					//这是假设吃单全部成交,挂单有剩余的场景
                    amount += find_orders[item].amount;

                    if(item == find_orders.length - 1 && amount > my_order.amount ){
                        
                                
                       find_orders[item].amount -= (amount - my_order.amount);
                    console.log("gxyyyimmmmm----", find_orders[item].amount);

                    }
					
                    console.log("gxyyy----", find_orders[item].amount);
                        let trade={
                           id:               null,//fixme
                           transaction_id:   null,
                           transaction_hash: null,
                           status:           "pending",
                           market_id:        my_order.market_id,
                           maker:            find_orders[item].trader_address,
                           taker:            my_order.trader_address,
                           price:            find_orders[item].price,
                           amount:           find_orders[item].amount,
                           taker_side:       find_orders[item].side,
                           maker_order_id:   find_orders[item].id,
                           taker_order_id:   my_order.id,
                           created_at:       create_time
                        };

					let trade_id = this.utils.get_hash(trade);
					trade.id = trade_id;
                  //插入trades表_  fixme__gxy        
                    trade_arr.push(trade);
		 		//匹配订单后，同时更新taker和maker的order信息,先不做错误处理,4个数值先写死
				  let update_maker_orders_info = [1,2,3,4,create_time,find_orders[item].id];
				  let update_taker_orders_info = [1,2,3,4,create_time,my_order.id];
           		  await this.db.update_orders(update_maker_orders_info);
            	  await this.db.update_orders(update_taker_orders_info);
               	  await this.db.insert_trades(this.utils.arr_values(trade));
            
                }
		    
                return trade_arr;
        
        }

        async call_asimov(trades) {
                let mist  = new mist_ex(ex_address);
                walletInst = await getTestInst();

                console.log("dex_match_order----gxy---22",trades);
				//更新utxo的操作放在打包交易之前，不然部分时候还是出现没更新的情况
                await walletInst.queryAllBalance();

                        //结构体数组转换成二维数组,代币精度目前写死为7,18的会报错和合约类型u256不匹配
                        let trades_info  =[];
                for(var i in trades){
                       let trade_info = [
                            trades[i].taker,
                            trades[i].maker,
                           //trades[i].amount *  trades[i].price * Math.pow(10,18),  //    uint256 baseTokenAmount;
                           // trades[i].amount * Math.pow(10,18),  // quoteTokenAmount;
                            10,  //    uint256 baseTokenAmount;
                            5,  // quoteTokenAmount;
                            trades[i].taker_side
                            ];
                         trades_info.push(trade_info);
                }
                

                let order_address_set = [index.PAI,index.GXY,index.relayer];

                mist.unlock(walletInst,"111111");
                let [err,txid] = await to(mist.dex_match_order(trades_info,order_address_set));


                console.log("gxy---engine-call_asimov_result = -",txid);

                return txid;
        }


}
