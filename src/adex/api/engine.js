import to from 'await-to-js'
import TokenTest from '../../wallet/contract/TokenTest'
import walletHelper from '../../wallet/lib/walletHelper'
var date = require("silly-datetime");


let walletInst;
async function getTestInst(){
        if( walletInst ) return walletInst;
        walletInst = await walletHelper.testWallet('ivory local this tooth occur glide wild wild few popular science horror','111111')
                return walletInst
}


export default class engine{
        db;
        constructor(client) { 
                this.db = client;
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
                    amount += find_orders[item].amount;

                    if(item == find_orders.length - 1 && amount > my_order.amount ){
                        
                                
                       find_orders[item].amount -= (amount - my_order.amount);
                    console.log("gxyyyimmmmm----", find_orders[item].amount);

                    }

                    console.log("gxyyy----", find_orders[item].amount);
                        let trade={
                           id:               null,
                           transaction_id:   null,
                           transaction_hash: null,
                           status:           "pending",
                           market_id:        my_order.market_id,
                           maker:            find_orders[item].trader_address,
                           taker:            my_order.trader_address,
                           price:            find_orders[item].price,
                           amount:           find_orders[item].amount,
                           taker_side:       my_order.side,
                           maker_order_id:   find_orders[item].id,
                           taker_order_id:   my_order.id,
                           created_at:       create_time
                        };
                  //插入trades表_  fixme__gxy        
                    trade_arr.push(trade);
                }
                
                return trade_arr;
        
        }

        async call_asimov(trades) {
                
           // let addr = '0x6699fe56a98aa190bdd63239e82d03ae0dba8ad1a1';
           // let value = 33;

                console.log("gxy44-trades = --",trades);
                let tokenTest = new TokenTest();
                walletInst = await getTestInst();
                        let [err,result] = await to(tokenTest.dex_match_order(walletInst,trades))

                         console.log("gxy---engine-call_asimov_result = -",result);


                        if( !err ){
                                // 先简单处理，Execute 前更新UTXO
                                await walletInst.queryAllBalance()
                        }
                return "kkkk";
        }


}
