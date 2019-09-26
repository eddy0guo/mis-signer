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

                    match_orders.push(result[i]);
                    //返回的字面量用+处理成数值
                    amount += +result[i].amount;  
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
            /*
             *------------------+--------------------------
             id               | integer                    
             transaction_id   | integer                    
             transaction_hash | text                       
             status           | text                       
             market_id        | text                       
             maker            | text                       
             taker            | text                       
             price            | numeric(32,18)             
             amount           | numeric(32,18)             
             taker_side       | text                       
             maker_order_id   | text                       
             taker_order_id   | text                       
             created_at       | timestamp without time zone
             *
             */
           /***
            *
            *
            *  { id:
            *       '7ffad1ed9c1e152e8bc0e6064bbefb042e6739254f5f618d93659c3cfd762992',
            *           trader_address: '0x43d9649b4a2d2ef6d03a877d440d448d1c1ce',
            *               market_id: 'ASIM-PAI',
            *                   side: 'buy',
            *                       price: '1.430000000000000000',
            *                           amount: '4.966700000000000000',
            *                               status: '10:44:31 AM',
            *                                   type: null,
            *                                       available_amount: null,
            *                                           confirmed_amount: null,
            *                                               canceled_amount: null,
            *                                                   pending_amount: null,
            *                                                       updated_at: null,
            *                                                           created_at: null },
            */
                 var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss'); 
                let trade_arr = [];
                let amount=0;
                for(var item = 0; item < find_orders.length;item++){
                    
                    //最低价格的一单最后成交，成交数量按照吃单剩下的额度成交,并且更新最后一个order的可用余额fixme__gxy
                    if(item == find_orders.length - 1 && amount > my_order.amount ){
                                
                       find_orders[item].amount = find_orders[item].amount - amount;

                    }
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
                    amount += find_orders[item].amount;
                        trade_arr.push(trade);
                }
                
                return trade_arr;
        
        }

        async call_asimov(trades) {
                
                let tokenTest = new TokenTest()
                walletInst = await getTestInst();
                let [err,result] = await to(tokenTest.testTransfer(walletInst))
                 console.log(result,err);

                if( !err ){
                        // 先简单处理，Execute 前更新UTXO
                        await walletInst.queryAllBalance()
                }
                return result;
        }


}
