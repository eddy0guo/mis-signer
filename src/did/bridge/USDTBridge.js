import to from 'await-to-js'
import axios from 'axios'
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'
import DepositModel from '../models/deposit'
import mist_config from '../../cfg'

//axios.defaults.baseURL = 'https://api.bitcore.io/api/BTC/testnet'
axios.defaults.baseURL = process.env.ETH_EXPLORER_RPC

// https://api.bitcore.io/api/BTC/testnet/block/tip
// https://api.bitcore.io/api/BTC/testnet/address/n2h3AZzCWdWc2z5NEjYJVtDmR7vBn1eq9z/coins
// https://api.bitcore.io/api/BTC/testnet/tx/f903af5d0143f2861b7b9054b57b5d705802aa70705aafeddf8ebb2677f470d8

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

/*
let data = {"code":"1234","name":"yyyy"};
axios.post(`${this.$url}/test/testRequest`,data)
.then(res=>{
    console.log('res=>',res);            
})
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "get_usdt_txids","params": {"address":"0xb1648746DabFc8e8c920f57f8b445BC08d3E6675"},"id":123 }' http://119.23.215.121:8030


   }
      else
      {
        this.$axios({
                 url: '',
                 method:'post',
                 //发送格式为json
                 data:JSON.stringify({func:'query',
                                      param:['3aa3a1fe7fe987945c8a097fa5274d352609b65021de4f0f0f8a4027479e802d']}),
//                 headers:
//                        {
//                          'Content-Type': 'application/json'
//                        }
               }).then(function(return_data)
        {
          alert(return_data)
        },function(return_data)
*/
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

	async withdraw(amount) {
		console.log(amount)
	}

}
