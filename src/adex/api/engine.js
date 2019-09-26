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
                if (message[2] == "buy"){
                        type = "sell"
                }

                let filter = [message[3],type];

                let result = await to(this.db.filter_orders(filter)); 

                console.log("gxy4444444444----",result);
                console.log("gxy4444444444----",result);
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
