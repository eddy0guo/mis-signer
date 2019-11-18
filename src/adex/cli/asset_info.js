import client from '../models/db'
import utils2 from '../api/utils'
import { chain } from '../../wallet/api/chain'
import to from 'await-to-js'
import mist_wallet1 from '../api/mist_wallet'
import Token from '../../wallet/contract/Token'
const crypto = require('crypto');
import mist_config from '../../cfg'
import Asset from '../../wallet/asset/Asset'
import fake_token from '../../wallet/contract/AssetToken'
import walletHelper from '../../wallet/lib/walletHelper'
var date = require("silly-datetime");
let walletInst;
async function getTestInst(){
    walletInst = await walletHelper.testWallet(mist_config.fauct_word,'111111')
    return walletInst
}

export default class assets{
	db;
	exchange;
	root_hash;
	mist_wallet;
	constructor() {
		this.db = new client();
		this.utils = new utils2;
		this.mist_wallet = new mist_wallet1();
	}

	async status_flushing() {
		this.loop();
	}

	async loop() {
	

		let create_time = this.utils.get_current_time();
		let token_arr = await this.mist_wallet.list_tokens();
		//asim的先不管
		token_arr.splice(1,1);
		console.log("-asset_info---gxyyyyyy---",token_arr);
		let inserts = [];
		for(var i in token_arr){
			let asset = new Asset(token_arr[i].asim_assetid)
			let [err4,assets_balance] = await to(asset.balanceOf(mist_config.fauct_address))
			let asset_balance=0;
			//z这里返回了所以币种的asset余额
			for(let j in assets_balance){
				if( token_arr[i].asim_assetid == assets_balance[j].asset){
					asset_balance = assets_balance[j].value;
				}
			}
			let assetToken = new fake_token(token_arr[i].asim_address);
			walletInst = await getTestInst();
			assetToken.unlock(walletInst,'111111')
			let [err,result] = await to(assetToken.getAssetInfo())
			console.log("asset_info----",result,err)

			let circulation_amount = +result[5]/100000000 - +asset_balance;
			let asset_info={
				id:null,
				asset_id:token_arr[i].asim_assetid,
				asset_name:token_arr[i].symbol,
				producer:mist_config.fauct_address,
				total: +result[5]/100000000,
				producer_amount:asset_balance,
				circulation_amount: circulation_amount,
				created_at:create_time
			}
			console.log("gxy-----asset_info-",asset_info);
			asset_info.id = this.utils.get_hash(asset_info); 
			inserts.push(asset_info);
		}

		for(var i in inserts){
			this.db.insert_assets_info(this.utils.arr_values(inserts[i]));
		}

		setTimeout(()=>{
			this.loop.call(this)
		//间隔时间随着用户量的增长而降低
		},1000 * 10);

	}


}
