import to from 'await-to-js'
import TokenTest from '../../wallet/contract/TokenTest'
import walletHelper from '../../wallet/lib/walletHelper'

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

                return match_orders;
        }
        
        async make_trades(orders){
            /*
             *
             *
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
            
        
        }

        async call_asimov(message) {


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
