import to from 'await-to-js'
import axios from 'axios'
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'
import DepositModel from '../models/deposit'
import mist_config from '../../cfg'
const Web3 = require('web3')
const ethereumjs = require('ethereumjs-tx')
let web3 = new Web3(new Web3.providers.HttpProvider("http://119.23.215.121:29842"));

//axios.defaults.baseURL = 'https://api.bitcore.io/api/BTC/testnet'
axios.defaults.baseURL = mist_config.eth_explorer_rpc
var contractAddr = '0x2482a9c2573b13f70413030004f76b1421749d44';

// https://api.bitcore.io/api/BTC/testnet/block/tip
// https://api.bitcore.io/api/BTC/testnet/address/n2h3AZzCWdWc2z5NEjYJVtDmR7vBn1eq9z/coins
// https://api.bitcore.io/api/BTC/testnet/tx/f903af5d0143f2861b7b9054b57b5d705802aa70705aafeddf8ebb2677f470d8
var contractAbi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}]

export default class USDTBridge {
	times;
	constructor(asimAddress, ethAddress) {
		this.asimAddress = asimAddress
		this.ethAddress = ethAddress
		this.times = 0;
	}
	
	async faucetWallet() {
		let wallet = await walletHelper.testWallet(
			mist_config.bridge_fauct_word,mist_config.wallet_default_passwd)
		return wallet
	}


	async userWallet(userWord) {
        let wallet = await walletHelper.testWallet(userWord,mist_config.wallet_default_passwd)
        return wallet
    }

	start(delay) {
		console.log("txs--000-");
        setTimeout(() => {
            this.loop.call(this)
        }, delay);
    }

    async loop() {

		let txs = await this.checkAddress()
		console.log("txs222---",txs);
		 if(txs) {
            console.log("txs get a deposit and convert asset tx=",txs);
            return
       }else if(this.times++ >= 12){
            console.log("txs have no deposit in ten minutes");
            return
            
        }else{
            this.timer = setTimeout(() => {
                this.loop.call(this)
            }, 5000);
        }
    }

	async checkAddress() {
		//let [err,res] = await to(axios.get(`address/${this.btcAddress}/coins`))
		let [err,res] = await to(axios({
				url: '',
				method:'post',
				data:JSON.stringify({jsonrpc:'2.0',method: 'get_usdt_txids',id:123,
				params:{'address':this.ethAddress}}),
				headers:{'Content-Type': 'application/json'}
			}))
		let result = JSON.parse(res.data.result);
		console.log("checkAddress--eth---",err,result.recent_tx);
        if( err ) return
		let record = await this.getFundingRecord(result.recent_tx[0]);
		let res2;
		if ( record.status != 'success' ) 
		{	
			res2 = await this.mintAsimUSDT(record.value)
			if( res2 ) {
				await record.update({
					asim_tx:res2,
					status:'success'
				})
				console.log('Update Record:',res2)
			}
		}else{
			console.log("this txid is already mint");	
		}
        return res2
	}
	
	async getFundingRecord(txinfo){
		let txid = txinfo.txid
		let tx = await DepositModel.findOne({txid})
		if( !tx ){
			tx = new DepositModel({
				txid,
				chain: 'USDT',
				network: 'ropsten',
				address:  this.ethAddress,
				height: '2222',
				value: txinfo.amount,
				asim_address: this.asimAddress,
				asim_tx: 'pending',
				status: 'pending',
				created_time: new Date().getTime(),
			});
			// save the user
			let err = await tx.save()
			if( err ) console.log(err)
		}

		return tx
	}
	async mintAsimUSDT(amount) {
		let asset = new Asset('000000000000001700000001')
		let wallet = await this.faucetWallet()
		asset.unlock(wallet,"111111")

		let address = await wallet.getAddress()
		console.log("faucet address:",address)

		let balance = await asset.balanceOf(address)
		console.log(balance)

		let [err,res] = await to(asset.transfer(this.asimAddress,amount))
		console.log("Transfer:",res,err)
		return res
	}

	//待验证
	async usdtTransfer(sender,receiver, amount) {
        console.log(`Start to send ${amount} tokens to ${receiver}`);
        const contract = web3.eth.contract(contractAbi).at(contractAddr);
        const data = contract.transfer.getData(receiver, amount * 1e18);

        const gasPrice = web3.eth.gasPrice;
        const gasLimit = 300000;

        var tx = new ethereumjs.Transaction({
          'from': sender,
          'nonce': web3.toHex(web3.eth.getTransactionCount(sender)),
          'gasPrice': web3.toHex(gasPrice),
          'gasLimit': web3.toHex(gasLimit),
          'to': contractAddr,
          'value': "0x0",
          'data': data,
          'chainId': 3
        });
		let prikey =  mist_config.bridge_facut_eth_prikey;

        tx.sign(Buffer.from(prikey, 'hex'));
        var raw = '0x' + tx.serialize().toString('hex');
        //alert(raw);
		  console.log("rrrrrrr",tx)
        web3.eth.sendRawTransaction(raw, function (err, transactionHash) {
         if(err!=''){
            console.log('Error: '+ err);
         }
         console.log('Transaction : '+ transactionHash);
        });
    }

	async withdraw(word,amount) {
		console.log(amount)
		 console.log(amount)
        let asset = new Asset('000000000000001700000001');
        let wallet = await this.userWallet(word);
        asset.unlock(wallet,"111111")

        let address = await wallet.getAddress()
        console.log("user address:",address)

        let balance = await asset.balanceOf(address)
        console.log(balance);
        let [err,res] = await to(asset.transfer(mist_config.bridge_fauct_asim_address,amount))
        console.log("22222",res);
        if(res){
            let result = await this.usdtTransfer(mist_config.bridge_fauct_eth_address,this.ethAddress,amount);
            if(result){
                //insert mongo
            }

        }
	}

}
