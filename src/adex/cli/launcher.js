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
            console.log("time--gxygxylaunchertrades=", trades);
			let current_time = this.utils.get_current_time();
			if (trades.length == 0) {
					   setTimeout(()=>{
						this.loop.call(this)
						}, 3000);
				return
			}

						//只要进入laucher阶段就先把状态设置为pending，防止engine那边在laucher的时候，继续在当前transaction_id里继续插数据
						let update_trade_info = ['pending',,current_time,trades[0].transaction_id];
						await this.db.launch_update_trades(update_trade_info);


					  let index = trades[0].transaction_id % 3;
					 let trades_hash = [];
					 let markets = await this.db.list_markets();
					 console.log("time--markets",markets);
						for (let i in trades) {
							//耗时
							//let token_address = await this.db.get_market([trades[i].market_id]);
							let token_address;
							for(let j in markets){
								if (trades[i].market_id	== markets[j].id){
									 token_address = markets[j];	
								}
							}

							if( token_address ==  undefined){
								console.error("not support market id");	
								continue;
							}

							let trade_info ={
								trade_hash: trades[i].trade_hash,
								taker: trades[i].taker,
								maker: trades[i].maker,
								base_token_address: token_address.base_token_address,
								quote_token_address: token_address.quote_token_address,
								relayer: mist_config.relayers[index].address,
								base_token_amount: NP.times(+trades[i].amount, 100000000), //    uint256 baseTokenAmount;
								quote_token_amount: NP.times(+trades[i].amount, +trades[i].price, 100000000), // quoteTokenAmount;
								r: null,
								s: null,
								side: trades[i].taker_side,
								v: null
							};
							   //后边改合约传结构体数据
							trades_hash.push(trade_info);
						}

						 let mist = new mist_ex10(mist_config.ex_address);
						 walletInst = await getTestInst(mist_config.relayers[index].word);
						mist.unlock(walletInst, "111111");
						let [err2, result] = await to(walletInst.queryAllBalance());
						let [err, txid] = await to(mist.matchorder(trades_hash,mist_config.relayers[index].prikey));
						console.log("gxy---engine-call_asimov_result33333 = -", txid, err);

						console.log("time--222--",this.utils.get_current_time())

						if(!err){
						let update_trade_info = ['pending',txid,current_time,trades[0].transaction_id];
						await this.db.launch_update_trades(update_trade_info);

						console.log("time-4444--",this.utils.get_current_time())

						let TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, "pending", trades[0].created_at, trades[0].created_at];
						this.db.insert_transactions(TXinfo);
						}else{

						let update_trade_info = ['matched','',current_time,trades[0].transaction_id];
						await this.db.launch_update_trades(update_trade_info);
						console.log("time--444--err--",this.utils.get_current_time())
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
		}, 7000);
//		}, 1800000);

	}


}
