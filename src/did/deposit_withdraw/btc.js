import to from 'await-to-js'
const crypto = require('crypto');
var date = require("silly-datetime");
let user_tx_records = require("../models/user_tx_records");
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'
 var child = require('child_process');


let walletInst;
async function getTestInst(){
    if( walletInst ) return walletInst;
    walletInst = await walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
    return walletInst
}

//curl https://api.blockcypher.com/v1/btc/main/addrs/1DEP8i3QJCsomS4BSMY2RpU1upv62aGvhD

// https://api.bitcore.io/api/BTC/testnet/address/n2h3AZzCWdWc2z5NEjYJVtDmR7vBn1eq9z/coins

export default class btc{
	time;
	balance;
	asim_address;
	btc_address;
	constructor() {
	}

	async start_deposit(user) {
		user_tx_records.find({'username':'13682471714','token_name':'BTC'}).sort({'created_time':-1}).limit(1).exec( async (err,docs) => {
		// 定义合约
		console.log("docs-----",docs);
		console.log("docs-----",user);
		// 查看某个账号的代币余额

		if(!docs[0]){
			this.balance = 0
		}else{
			this.balance = docs[0].balance;
		}
		this.asim_address = user.asim_address;
		this.btc_address =  user.btc_address;
		this.username =  user.username;
		this.loop_deposit();

         });
	}



	async loop_deposit() {
		 let cmd = 'curl -v https:\/\/api.blockcypher.com\/v1\/btc\/main\/addrs\/1DEP8i3QJCsomS4BSMY2RpU1upv62aGvhD';
        console.log("ssss---",cmd);
        let sto =  child.execSync(cmd)
		let current_balance = JSON.parse(sto).balance;
		let txid = JSON.parse(sto).txrefs[0].tx_hash;
        console.log("222222222222222i5555555",JSON.parse(sto).balance);
        console.log("2222222223335555",JSON.parse(sto).txrefs);




		//该api返回的单位也是10**8进制
		let current_balance2 = current_balance /  (1 * 10 **8);

		let current_time = new Date().getTime();
		console.log("1-2-3-4",current_balance2,current_time,this.time,this.balance);
		if(current_balance2   > this.balance ){
			if(!this.time){this.time = new Date().getTime();}
			//五分钟(12个块)之后确认充值完成
			if( current_time - this.time > 2 * 1000){
				let amount = current_balance2  - this.balance
				console.log("confirm a transactions amount = ",amount);
	    		let asset = new Asset('000000000000000300000001');
        		walletInst = await getTestInst();
        		//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
        		asset.unlock(walletInst,"111111")
				console.log("this.address",this.address)
				let [err,result] = await to(asset.transfer(this.asim_address,amount));
        		console.log(result,err);

				if(result){
				     let new_record = new user_tx_records({
                     username: this.username,
					 tx_type:"deposit",
					 token_name:'BTC',
					 amount:amount,
					 balance:current_balance2,
					 from_address:"11111",
					 to_address:this.btc_address,
					 created_time:current_time,
					 txid:txid
               		 });
                // save the user
                	new_record.save(function(err) {
                    if (err) {
                      console.log("errrpe----",err); 
                    }

                    });
                }
					
				return;
			}
			console.log("get  a transactions amount,please wait confirm");
		}else{
			console.log("the same balance");
		}
		setTimeout(()=>{
				this.loop_deposit.call(this)
			},1000 * 2);
	}

	async withdraw() {

	}

}
