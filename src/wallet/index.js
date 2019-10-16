import { Router } from 'express'
import { chain } from './api/chain'
import { walletRPC } from './api/wallet'
import walletHelper from './lib/walletHelper'
import to from 'await-to-js'
import StandardToken from './contract/Token'
import TokenTest from './contract/TokenTest'
import AssetTest from './asset/AssetTest'
import Asset from './asset/Asset'
import { CONSTANT } from "./constant";

import Erc20 from './contract/ERC20'

let testWallets = {
	"0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a":"benefit park visit oxygen supply oil pupil snack pipe decade young bracket",
	"0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e":"federal strong comic spy real develop cave ramp equip cheap behind negative",
	"0x668a4cd95f49cd3eb6639a860d4cc7e94172571e7e":"present shoe never wise ignore nuclear bring sick left kangaroo shed gold"
}

let taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
let taker_word = 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street';
let taker_wallet;
let asim_address = '0x639a9f78bdaac0a33b39de17c13cf7271d86800a7d';

// 避免重复创建Taker Wallet Instance
async function getTakerWallet() {
	if( taker_wallet ) return taker_wallet;
	taker_wallet = await walletHelper.testWallet(taker_word,'111111')
	return taker_wallet
}

let walletInst;
async function getTestInst(){
	if( walletInst ) return walletInst;
	walletInst = await walletHelper.testWallet('disagree topic plastic edit empty inside net mushroom aim video radar element','111111')
	return walletInst
}

export default ({ config, db }) => {
	let wallet = Router();
	let tokenTest = new TokenTest()
	let assetTest = new AssetTest()

	wallet.get('/', async (req, res) => {
		walletInst = await getTestInst();
		let address = await walletInst.getAddress()
		res.json({ wallet:address })
	});

	wallet.get('/faucet/:token/:address',async (req, res) => {
		console.log(req.params)
		let token = new StandardToken(req.params.token)
		let takerWallet = await getTakerWallet();
		await takerWallet.queryAllBalance()
		token.unlock(takerWallet,'111111')
		let [err,result] = await to(token.transfer(req.params.address,10000))
		console.log(result,err);
		res.json({ result:result,err:err });
	});

	wallet.get('/balanceOf/:token/:address',async (req, res) => {
		console.log(req.params)
		let token = new StandardToken(req.params.token)
		let [err,result] = await to(token.balanceOf(req.params.address))
		console.log(result,err);
		res.json({ result:result,err:err });
	});

	wallet.get('/balance',async (req, res) => {

		let [err,result] = await to(tokenTest.testBalanceOf())
		console.log(result,err);

		res.json({ result:result,err:err });
	});

	wallet.get('/transfer',async (req, res) => {

		walletInst = await getTestInst();
		let [err,result] = await to(tokenTest.testTransfer(walletInst))
		console.log(result,err);

		if( !err ){
			// 先简单处理，Execute 前更新UTXO
			await walletInst.queryAllBalance()
		}

		res.json({ result:result,err:err });
	});

	wallet.get('/approve',async (req, res) => {

		walletInst = await getTestInst();
		let [err,result] = await to(tokenTest.testApprove(walletInst))
		console.log(result,err);

		res.json({ result:result,err:err });
	});

	/**
	 * Assets Test
	 */

	wallet.get('/assetBalanceOf/:address',async (req,res)=>{
		let asset = new Asset(CONSTANT.DEFAULT_ASSET)
		let [err,result] = await to(asset.balanceOf(req.params.address))
		res.json({ result:result,err:err });
	});

	//这里后期是要传输入信息和加密的密闻
	wallet.get('/assetTransfer/:address/:amount',async (req, res) => {
		let asset = new Asset(CONSTANT.DEFAULT_ASSET)	
		walletInst = await getTestInst();
		//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
		asset.unlock(walletInst,"111111")
     	let [err,result] = await to(asset.transfer(req.params.address,req.params.amount));

		console.log(result,err);

		if( !err ){
			// 先简单处理，Execute 前更新UTXO
			await walletInst.queryAllBalance()
		}
		
		res.json({ result:result,err:err });
	});
	
	//钱包到币币
	wallet.get('/deposit/:amount',async (req, res) => {
		let erc20 = new Erc20(asim_address);
		walletInst = await getTestInst();
		//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
		erc20.unlock(walletInst,"111111")
       let [err,result] = await to(erc20.deposit(req.params.amount));
		console.log(result,err);

		if( !err ){
			// 先简单处理，Execute 前更新UTXO
			await walletInst.queryAllBalance()
		}
		
		res.json({ result:result,err:err });
	});


	//币币到钱包
	wallet.get('/withdraw/:amount',async (req, res) => {
		let erc20 = new Erc20(asim_address);
		walletInst = await getTestInst();
		//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
		erc20.unlock(walletInst,"111111")
		//这里为了和deposit保持单位一致
       let [err,result] = await to(erc20.withdraw(req.params.amount * Math.pow(10,8)));

		console.log(result,err);

		if( !err ){
			// 先简单处理，Execute 前更新UTXO
			await walletInst.queryAllBalance()
		}
		
		res.json({ result:result,err:err });
	});




	/**
	 * curl -X POST --data '{"id":1, "jsonrpc":"2.0","method":"asimov_searchRawTransactions",
	 * "params":["0x666e55294d0ee2b7306b9a765b576df9c8ed73a877",true,0,1,false,false,[]]}' 
	 * -H "Content-type: application/json" http://localhost:8545/
	 * 
	 * Parameters
	 * -transaction associated address
	 * -get detail or not
	 * -transaction offset
	 * -number of transactions
	 * -get last output or not
	 * -reverse or not
	 * -addresses not included
	 * 
	 * Returns
	 * -information of raw transaction
	 */
	wallet.get('/tx',async (req, res) => {
		let address
		if( req.query.address ){
			address = req.query.address
		} else {
			walletInst = await getTestInst();
			address = await walletInst.getAddress()
		}
		let num = 3
		let reverse = true

		let [err,result] = await to(chain.searchrawtransactions([address,true,0,num,false,reverse,[]]))

		res.json({result,err });
	});

	wallet.get('/rawtx',async (req, res) => {
		let txid = req.query.txid

		let [err,result] = await to(chain.getrawtransaction([txid,true,true]))

		res.json({result,err });
	});

	/**
	 * asimov_getUtxoByAddress
	 * Returns UTXO of given address.
	 * 
	 * Parameters
	 * address
	 * asset (optional, "")
	 * Returns
	 * UTXO information
	 */
	wallet.get('/utxo',async (req, res) => {
		let address
		if( req.query.address ){
			address = req.query.address
		} else {
			walletInst = await getTestInst();
			address = await walletInst.getAddress()
		}

		let [err,result] = await to(walletRPC.getutxobyaddress([[address],""]))

		res.json({result,err });
	});


	return wallet;
}
