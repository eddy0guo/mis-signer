import to from 'await-to-js'
import utils1 from '../adex/api/utils'
import psql from '../adex/models/db'

import NP from 'number-precision'

import mist_config from '../cfg'
import AsimovWallet from  '../../node_modules/asimov-wallet/lib/AsimovWallet'
import AsimovConst from  '../../node_modules/asimov-wallet/lib/lib/AsimovConst'

import apicache from 'apicache'
let cache = apicache.middleware

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}

export default class watcher{

	psql_db = new psql();
	utils = new utils1();

    async start() {
        this.asset2coin_loop();
    }

	async asset2coin_loop() {

		let [err,pending_trade] = await to(this.psql_db.filter_bridge(['asset2coin','successful','pending']));
		console.log("err,pending_trade",err,pending_trade);
		if(pending_trade.length == 0){
			
			console.log("have not pending trade");
            setTimeout(()=>{
            this.asset2coin_loop.call(this)
            }, 2000);

            return;
		}
		/*
		
		
		
		
		*/
		let {id,address,amount,token_name} = pending_trade[0];
		console.log("---------6666666",pending_trade[0])
		let current_time = this.utils.get_current_time();
		let transfer_tokens = await this.psql_db.get_tokens([token_name])

		let wallet = new AsimovWallet({
			name: 'test',
			rpc: mist_config.asimov_child_rpc,
			mnemonic: mist_config.bridge_word,
			// storage: 'localforage',
		});
		 let balance = await wallet.account.balance();

		let [child_err,child_txid] = await to(wallet.contractCall.call(
			transfer_tokens[0].address,
			'mint(address,uint256)',
			[address,NP.times(amount,100000000)],
			AsimovConst.DEFAULT_GAS_LIMIT,0,
			AsimovConst.DEFAULT_ASSET_ID,
			AsimovConst.DEFAULT_FEE_AMOUNT,
			AsimovConst.DEFAULT_ASSET_ID,
			AsimovConst.CONTRACT_TYPE.CALL))
		console.log("---------------------------------child_err,child_txid",child_err,child_txid)
		if(child_txid){
			let info = [child_txid,"successful",current_time,id];

			let [err3,result3] = await to(this.psql_db.update_asset2coin_bridge(info));
			console.log("info123",err3,result3)
		}else{
			console.error(`error happend in send coin`)	
		}
		setTimeout(()=>{
            this.asset2coin_loop.call(this)
        //间隔时间随着用户量的增长而降低
        },1000 * 10);


    }

};
