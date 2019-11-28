import to from 'await-to-js'
import axios from 'axios'
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'
import DepositModel from '../models/deposit'
import WithdrawModel from '../models/withdraw'
import mist_config from '../../cfg'
const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx').Transaction
import NP from 'number-precision'
let web3 = new Web3(new Web3.providers.HttpProvider("http://119.23.215.121:29842"));

//axios.defaults.baseURL = 'https://api.bitcore.io/api/BTC/testnet'
axios.defaults.baseURL = mist_config.eth_explorer_rpc
var contractAddr = '0x2482a9c2573b13f70413030004f76b1421749d44';

// https://api.bitcore.io/api/BTC/testnet/block/tip
// https://api.bitcore.io/api/BTC/testnet/address/n2h3AZzCWdWc2z5NEjYJVtDmR7vBn1eq9z/coins
// https://api.bitcore.io/api/BTC/testnet/tx/f903af5d0143f2861b7b9054b57b5d705802aa70705aafeddf8ebb2677f470d8
function addPreZero(num){
  var t = (num+'').length,
  s = '';
  for(var i=0; i<64-t; i++){
    s += '0';
  }
  return s+num;
}


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
        var number = await web3.eth.getTransactionCount(sender);
        let id = await web3.eth.net.getId();
		let wei = NP.times(amount,1000000000000000000)
        var details = {
		  nonce: number,
		  gasPrice: '0x09184e72a0',
		  gasLimit: '0x27100',
		  to: contractAddr,
		  value: '0x00',
		  //依次是转账函数，接受人，金额
		  data: '0x' + 'a9059cbb' + addPreZero(receiver.substr(2)) + addPreZero(web3.utils.toHex(wei).substr(2))
		}
        var tx = new EthereumTx(details,{chain:'ropsten', hardfork: 'petersburg'})
        let prikey =  mist_config.bridge_facut_eth_prikey;
        tx.sign( Buffer.from(prikey, 'hex'))
        var serializedTx = tx.serialize();
		let [err,result] = await to(web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')));
		return [err,result]
		
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
            var [err5,result5] = await this.usdtTransfer(mist_config.bridge_fauct_eth_address,this.ethAddress,amount);
            if(result5){
                //insert mongo
				let tx = new WithdrawModel({
					txid: result5.transactionHash,
					chain: 'USDT',
					network: 'ropsten',
					address:  this.ethAddress,
					height: result5.blockNumber,
					value: amount,
					asim_address: this.asimAddress,
					asim_tx: res,
					status: 'success',
					created_time: new Date().getTime(),
				});
				// save the user
				let [err,result] = await to(tx.save())
				if(!err){
					return "withdraw success"; 
				}else{throw new Error('tx save failed')}
            }else{throw new Error('usdt transfer failed')}
        }else{throw new Error('mint failed')}
	}

}
