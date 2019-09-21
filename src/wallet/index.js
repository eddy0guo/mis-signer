import { Router } from 'express';
import erc20 from './lib/erc20';
import walletHelper from './lib/walletHelper';
import to from 'await-to-js'

let walletInst;
async function getWalletInst(){
	if( walletInst ) return walletInst;
	walletInst = await walletHelper.testWallet('benefit park visit oxygen supply oil pupil snack pipe decade young bracket','111111')
	return walletInst
}

export default ({ config, db }) => {
	let wallet = Router();
	

	wallet.get('/', async (req, res) => {
		// console.log(walletHelper)
		
		walletInst = await getWalletInst();
		// erc20.testTransfer(wallet);
		let address = await walletInst.getAddress()
		res.json({ wallet:address })
	});

	wallet.get('/1',async (req, res) => {

		walletInst = await getWalletInst();
		let [err,result] = await to(erc20.testBalanceOf(walletInst))
		console.log(result,err);

		// await walletInst.queryAllBalance()

		res.json({ result:result,err:err });
	});

	wallet.get('/2',async (req, res) => {

		walletInst = await getWalletInst();
		let [err,result] = await to(erc20.testTransfer(walletInst))
		console.log(result,err);
		if( !err ){
			// 先简单处理，Execute 前更新UTXO
			await walletInst.queryAllBalance()
		}

		res.json({ result:result,err:err });
	});

	return wallet;
}
