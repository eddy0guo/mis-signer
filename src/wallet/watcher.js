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

/*

master_txid,master_txid_status,child_txid,child_txid_status,updated_at


*/
async function send_asset(address,asset,amount){
	let master_wallet = new AsimovWallet({
		name: 'test4',
		rpc:mist_config.asimov_master_rpc,
		mnemonic:mist_config.bridge_word
	});


	await master_wallet.account.createAccount()
	return  await to(master_wallet.commonTX.transfer(address,amount,asset))
}

export default class watcher{

	psql_db = new psql();
	utils = new utils1();

    async start() {
        this.asset2coin_loop();
        this.coin2asset_loop();
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

	 async coin2asset_loop() {

        let [failed_err,failed_trade] = await to(this.psql_db.filter_bridge(['coin2asset','failed','successful']));
        console.log("err,pending_trade",err,pending_trade);
		if(failed_trade.length != 0){
			 let {id,address,amount,token_name} = failed_trade[0];
			 let tokens = await this.psql_db.get_tokens([token_name])

			let [master_err,master_txid] = await send_asset(address,tokens[0].asim_assetid,amount);
			console.log("1111----",master_err,master_txid)
			 if(master_txid){
				 let info = [master_txid,"successful",current_time,id];
				 let [err3,result3] = await to(this.psql_db.update_coin2asset_failed(info));
				 console.log("info123",err3,result3)
			 }else{
				console.error(`the trade ${id} failed again`)	 
				 
			 }

			
		}


        let [err,pending_trade] = await to(this.psql_db.filter_bridge(['coin2asset','pending','pending']));
        if(pending_trade.length == 0){

            console.log("have not pending trade");
            setTimeout(()=>{
            this.coin2asset_loop.call(this)
            }, 2000);

            return;
        }

		  let {id,address,amount,token_name} = pending_trade[0];
        console.log("---------6666666",pending_trade[0])
        let current_time = this.utils.get_current_time();
        let tokens = await this.psql_db.get_tokens([token_name])
				

		let child_wallet = new AsimovWallet({
			name: 'test',
			rpc: mist_config.asimov_child_rpc,
			mnemonic: mist_config.bridge_word,
			// storage: 'localforage',
		});
		 let balance = await child_wallet.account.balance();

		let [child_err,child_txid] = await to(child_wallet.contractCall.call(
			tokens[0].address,
			'burn(address,uint256)',
			[address,NP.times(amount,100000000)],
			AsimovConst.DEFAULT_GAS_LIMIT,0,
			AsimovConst.DEFAULT_ASSET_ID,
			AsimovConst.DEFAULT_FEE_AMOUNT,
			AsimovConst.DEFAULT_ASSET_ID,
			AsimovConst.CONTRACT_TYPE.CALL))
		console.log("---------child_err---child_txid",child_err,child_txid)
		if(child_err){
				

				console.log("have not pending trade");
				setTimeout(()=>{
				this.coin2asset_loop.call(this)
				}, 2000);

				return
		}

		let [master_err,master_txid] = await send_asset(address,tokens[0].asim_assetid,amount);
		console.log("1111--------matser--",master_err,master_txid)
		let master_txid_status = master_txid == null ? "failed":"successful";

		if(master_err){
			master_txid = null;	
		}
		
		let info = [master_txid,master_txid_status,child_txid,"successful",current_time,id];
		let [err3,result3] = await to(this.psql_db.update_coin2asset_bridge(info));
            console.log("info123",err3,result3)
		
	
		 setTimeout(()=>{
            this.coin2asset_loop.call(this)
        },1000 * 10);


    }

};
