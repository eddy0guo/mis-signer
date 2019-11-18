import to from 'await-to-js'
import axios from 'axios'
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'
import mist_config from '../../cfg'
import DepositModel from '../models/deposit'

axios.defaults.baseURL = mist_config.btc_explorer_rpc
//axios.defaults.baseURL = 'https://api.bitcore.io/api/BTC/testnet'

// https://api.bitcore.io/api/BTC/testnet/block/tip
// https://api.bitcore.io/api/BTC/testnet/address/n2h3AZzCWdWc2z5NEjYJVtDmR7vBn1eq9z/coins
// https://api.bitcore.io/api/BTC/testnet/tx/f903af5d0143f2861b7b9054b57b5d705802aa70705aafeddf8ebb2677f470d8

export default class BTCBridge {

	constructor(asimAddress, btcAddress) {
		this.asimAddress = asimAddress
		this.btcAddress = btcAddress
	}

	async faucetWallet() {
		let wallet = await walletHelper.testWallet(
			mist_confifg.bridge_fauct_word,mist_config.wallet_default_passwd)
		return wallet
	}

	start(delay) {
        setTimeout(() => {
            this.loop.call(this)
        }, delay);
    }

    stop() {
        if (this.timer > 0) {
            clearTimeout(this.timer)
            this.timer = -1
        }
    }

    async loop() {
        this.stop()
        await this.loopDeposit()
        this.timer = setTimeout(() => {
            this.loop.call(this)
        }, 2*60*1000);
    }

	async loopDeposit() {
		let txs = await this.checkAddress()
        return txs
	}

	async checkBlockTip() {
		let [err,res] = await to(axios.get(`block/tip`))
        if( err ) return
		// console.log('checkBlockTip:',res.data)
        return res.data.height
	}

	async checkAddress() {
		let [err,res] = await to(axios.get(`address/${this.btcAddress}/coins`))
        if( err ) return
		// console.log('checkAddress',res.data)
		let fundingTxOutputs = res.data.fundingTxOutputs
		let blockTip = await this.checkBlockTip()

		for( let i in fundingTxOutputs ) {
			let tx = fundingTxOutputs[i]
			if( tx.address == this.btcAddress ){
				// check minted
				let record = await this.getFundingRecord(tx)
				if ( record.status == 'success' ) continue
				if( blockTip - tx.mintHeight >= 6 ){
					// >= 6 confirmed
					console.log('TX >= 6 confirmed',tx)
					
					let res = await this.mintAsimBTC(tx.value/100000000)
					if( res ) {
						await record.update({
							asim_tx:res,
							status:'success'
						})
						console.log('Update Record:',res)
					}
					// TODO : UTXO的问题，不能在一个循环里进行多次增发，暂时一次只发送一个
					break
				}
			}
		}

        return fundingTxOutputs
	}
	
	async getFundingRecord(txinfo){
		let txid = txinfo.mintTxid
		let tx = await DepositModel.findOne({txid})
		if( !tx ){
			tx = new DepositModel({
				txid,
				chain: 'BTC',
				network: txinfo.network,
				address: txinfo.address,
				height: txinfo.mintHeight,
				value: txinfo.value,
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

	async checkTX(tx) {
		let [err,res] = await to(axios.get(`tx/${tx}`))
        if( err ) return
		console.log('checkTX:',res.data)
        return res
	}

	async mintAsimBTC(amount) {
		let asset = new Asset('000000000000001400000001')
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
