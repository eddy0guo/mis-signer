import client from '../models/db'
import utils2 from '../api/utils'
import {restore_order} from '../api/order'
import { chain } from '../../wallet/api/chain'
import walletHelper from '../../wallet/lib/walletHelper'
import to from 'await-to-js'
const crypto = require('crypto');
var date = require("silly-datetime");
import mist_config  from '../../cfg';
import mist_ex10 from '../../wallet/contract/mist_ex10'

import NP from 'number-precision'
let walletInst;

async function getTestInst(word) {
    // 暂时每次都重新创建实例，效率低点但是应该更稳定。
    walletInst = await walletHelper.testWallet(word, '111111')
    return walletInst
}

export default class launcher {
	db;
	exchange;
	root_hash;
	constructor(client) {
		this.db = client;
		this.utils = new utils2;
	}

	async start() {
		this.loop()
	}

	

	async loop() {
	
            let trades = await this.db.get_laucher_trades();
            console.log("launchertrades=", trades);
			let current_time = this.utils.get_current_time();
			if (trades.length == 0) {
				console.log("111111111111-launcher--",trades)
					   setTimeout(()=>{
						this.loop.call(this)
						}, 10000);
				return
			}

						console.log("gxyrelayers-aa--launcher0000",mist_config.relayers);
						let token_address = await this.db.get_market([trades[0].market_id]);

					//这里合约逻辑写反了。参数顺序也故意写反，使整体没问题，等下次合约更新调整过来，fixme
					//let order_address_set = [token_address[0].base_token_address,token_address[0].quote_token_address,index.relayer];
					    let index = trades[0].transaction_id % 3;
						let order_address_set = [token_address[0].quote_token_address, token_address[0].base_token_address, mist_config.relayers[index].address];

						 let trades_hash = [];
						for (var i in trades) {
							let trade_info = [
								trades[i].trade_hash,
								trades[i].taker,
								trades[i].maker,
								NP.times(+trades[i].amount, +trades[i].price, 100000000), //    uint256 baseTokenAmount;
								NP.times(+trades[i].amount, 100000000), // quoteTokenAmount;
								trades[i].taker_side
							];
							   //后边改合约传结构体数据
							trades_hash.push(trade_info);
						}

						 let mist = new mist_ex10(mist_config.ex_address);
						 walletInst = await getTestInst(mist_config.relayers[index].word);
						mist.unlock(walletInst, "111111");
						let [err2, result] = await to(walletInst.queryAllBalance());

						//let [err, txid] = await to(mist.matchorder(trades_hash, order_address_set));
						console.log("relayers------",mist_config.relayers[index]);
						let [err, txid] = await to(mist.matchorder(trades_hash, order_address_set,mist_config.relayers[index].prikey));
						console.log("gxy---engine-call_asimov_result33333 = -", txid, err);

						if(!err){
						let update_trade_info = ['pending',txid,current_time,trades[0].transaction_id];
						await this.db.launch_update_trades(update_trade_info);

						console.log("trades[i]=22222222222222", trades);
						let TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, "pending", trades[0].created_at, trades[0].created_at];
						this.db.insert_transactions(TXinfo);
						}else{
							//失败了不做任何处理，等待下次被laucher打包
						//	let update_trade_info = ['failed',txid,current_time,trades[0].transaction_id];
						//	await this.db.launch_update_trades(update_trade_info);
							/*
							console.log("trades[i]=22222222222222", trades);
							//交易失败分为两种情况，transaction里的交易回滚和交易打包失败，watcher处理前者
						//	let TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, "failed", trades[0].created_at, trades[0].created_at];
							  for(var index in trades){
									console.log("restore_order2222222222222", trades);
									restore_order(trades[index].taker_order_id,trades[index].amount);
									restore_order(trades[index].maker_order_id,trades[index].amount);
								}
							*/		
						}


		setTimeout(()=>{
			this.loop.call(this)
		}, 10000);

	}


}
