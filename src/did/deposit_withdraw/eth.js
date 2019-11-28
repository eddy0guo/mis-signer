import to from 'await-to-js'
const crypto = require('crypto');
var date = require("silly-datetime");
let user_tx_records = require("../models/user_tx_records");
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'

	// 引入web3
var Web3 = require('web3');
var   web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/2f9cbc5898af4be48b737dcea7d5105d"));
//var   web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/2f9cbc5898af4be48b737dcea7d5105d"));
// 定义合约abi
var contractAbi = [{"constant":true,"inputs":[],"name":"mintingFinished","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"cap","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"mint","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_value","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"finishMinting","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"burner","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[],"name":"MintFinished","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}];

// 合约地址
var contractAddress = "0x7FCCF800568747b178c6cBbe4Bf3d147df75ac61";
// 账号
//var currentAccount = "0x90a97d253608B2090326097a44eA289d172c30Ec";
var currentAccount = "0xF7aD9e873Ed1c6D257c7D497D78272e7F3574Aa4";

let walletInst;
async function getTestInst(){
    if( walletInst ) return walletInst;
    walletInst = await walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
    return walletInst
}


export default class eth{
	time;
	balance;
	asim_address;
	eth_address;
	constructor() {
	}

	async start_deposit(user) {
		//这里的生序和降序与mongo里面反着来了
		user_tx_records.find({username:user.username}).sort({'created_time':-1}).limit(1).exec( async (err,docs) => {
		// 定义合约
		console.log("docs-----",docs);
		console.log("docs-----",user);
		var myContract = new web3.eth.Contract(contractAbi, contractAddress, {
			from: currentAccount, // default from address
			gasPrice: '10000000000' // default gas price in wei, 10 gwei in this case
		});
		// 查询以太币余额
		let balance = await web3.eth.getBalance(user.eth_address);
		console.log("eth--balance---",balance / (1 * 10 ** 18));
		// 查看某个账号的代币余额
	
		this.balance = docs[0].balance;
		this.asim_address = user.asim_address;
		this.eth_address =  user.eth_address;
		this.username =  user.username;
		this.loop_deposit();

         });
	}



	async loop_deposit() {
		let current_balance = await web3.eth.getBalance(this.eth_address);
		let current_balance2 = current_balance /  (1 * 10 **18);

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
					 token_name:'ETH',
					 amount:amount,
					 balance:current_balance2,
					 from_address:"11111",
					 to_address:this.eth_address,
					 created_time:current_time,
					 txid:null
               		 });
                // save the user
                	new_record.save(function(err) {
                    if (err) {
                        return res.json({
                            success: false,
                            msg: 'Username already exists.'
                        });
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
