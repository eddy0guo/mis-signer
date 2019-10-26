import client from '../models/db'
import utils2 from '../api/utils'
import { chain } from '../../wallet/api/chain'
import to from 'await-to-js'
import mist_wallet1 from '../api/mist_wallet'
import Token from '../../wallet/contract/Token'
const crypto = require('crypto');
var date = require("silly-datetime");

export default class users{
	db;
	exchange;
	root_hash;
	mist_wallet;
	constructor() {
		this.db = new client();
		this.utils = new utils2;
		this.mist_wallet = new mist_wallet1();
	}

	async start_deposit() {
		this.loop_deposit();
	}


	async withdraw() {

	}

	async loop_deposit() {
	

		let users = await this.db.list_users();	
		let create_time = this.utils.get_current_time();
		let token_arr = await this.mist_wallet.list_tokens();

		for(let i in users){
			let address = users[i].address;	
			let balances = [];
			
			console.log("77777",token_arr);
			for(let j in token_arr){
                      console.log("obj111111111=",token_arr[j]);
                            let token = new Token(token_arr[j].address);
                            let [err,balance] = await to(token.balanceOf(address));
                            balances.push(balance);
            }
			balances.push(create_time);
			balances.push(address);
			console.log("555555",balances);
			await this.db.update_user_token(balances);
		}
		setTimeout(()=>{
			this.loop_token.call(this)
		//间隔时间随着用户量的增长而降低
		},1000 * 60);

	}

}
