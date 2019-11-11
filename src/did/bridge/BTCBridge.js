import to from 'await-to-js'
import walletHelper from '../../wallet/lib/walletHelper'
import Asset from '../../wallet/asset/Asset'
import axios from 'axios'

axios.defaults.baseURL = 'https://api.bitcore.io/api/BTC/testnet'

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
			'wing safe foster choose wisdom myth quality own gallery logic imitate pink',
			'111111')
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
		console.log('checkBlockTip:',res.data)
        return res.data.height
	}

	async checkAddress() {
		let [err,res] = await to(axios.get(`address/${this.btcAddress}/coins`))
        if( err ) return
		console.log('checkAddress',res.data)
		let fundingTxOutputs = res.data.fundingTxOutputs
		let blockTip = await this.checkBlockTip()

		for( let i in fundingTxOutputs ) {
			let tx = fundingTxOutputs[i]
			if( tx.address == this.btcAddress ){
				// check minted
				let minted = false
				if ( minted ) continue
				if( blockTip - tx.mintHeight >= 6 ){
					// >= 6 confirmed
					console.log('TX >= 6 confirmed',tx)
					this.mintAsimBTC(tx.value/100000000)
				}
			}
		}

        return fundingTxOutputs
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
		console.log(res,err)
		return res
	}

	async withdraw(amount) {

	}

}