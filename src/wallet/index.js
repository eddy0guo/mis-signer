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
import Erc20Test from './contract/ERC20Test'

import mist10 from './contract/mist_ex10'
import cdp from './contract/cdp'
import adex_utils from '../adex/api/utils'
import psql from '../adex/models/db'
//import { btc_start,eth_start,asim_asset_start} from "../deposit";

var spawn = require('child_process').spawn;


let testWallets = {
	"0x6619fd2d2fd1db189c075ff25800f7b98ff3205e5a":"benefit park visit oxygen supply oil pupil snack pipe decade young bracket",
	"0x66b31cab7d9eb10cfcdb7a3c19dcd45f362e15ba8e":"federal strong comic spy real develop cave ramp equip cheap behind negative",
	"0x668a4cd95f49cd3eb6639a860d4cc7e94172571e7e":"present shoe never wise ignore nuclear bring sick left kangaroo shed gold"
}

let taker = '0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9';
let taker_word = 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street';
let taker_wallet;
let asim_address = '0x639a9f78bdaac0a33b39de17c13cf7271d86800a7d';
let mist10_address = '0x63f2e35430d95ae63d63f8d115c95ffc9ff5b3d68e';
let cdp_address = '0x6367f3c53e65cce5769166619aa15e7da5acf9623d';

// 避免重复创建Taker Wallet Instance
async function getTakerWallet() {
	if( taker_wallet ) return taker_wallet;
	taker_wallet = await walletHelper.testWallet(taker_word,'111111')
	return taker_wallet
}

let walletInst;
async function getTestInst(){
	if( walletInst ) return walletInst;
//chenfei
//	walletInst = await walletHelper.testWallet('wonder snap ripple scare salon luxury best narrow daring hen brief pet','111111')
//xuweiwei
//	walletInst = await walletHelper.testWallet('disagree topic plastic edit empty inside net mushroom aim video radar element','111111')
//test
	walletInst = await walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
	return walletInst
}

export default ({ config, db }) => {
	let wallet = Router();
	let tokenTest = new TokenTest()
	let assetTest = new AssetTest()
	let psql_db = new psql();
	let utils = new adex_utils();

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

	
	 wallet.get('/orderhash',async (req, res) => {

		console.log("33333");
		let mist = new mist10(mist10_address);
        walletInst = await getTestInst();
		 mist.unlock(walletInst,"111111")
		await walletInst.queryAllBalance()

        let [err,result] = await to(mist.orderhash(walletInst))
		let kkk =`curl -X POST --data '{"id":1, "jsonrpc":"2.0","method":"flow_getTransactionReceipt","params":["${result}"]}}' -H "Content-type: application/json" https://test-rpc.asimov.network`;

		console.log("8888",kkk);
        console.log(result,err);

        res.json({ result:result,err:err });
    });

	//清仓
	wallet.get('/cdp_liquidate/:borrow_id/:asset_id/:address',async (req, res) => {

		console.log("33333");
		let cdp_obj = new cdp(cdp_address);
        walletInst = await getTestInst();
		 cdp_obj.unlock(walletInst,"111111")
		await walletInst.queryAllBalance()
	
        let [err,result] = await to(cdp_obj.liquidate(req.params.borrow_id,req.params.asset_id));
        console.log(result,err);


			let current_time = utils.get_current_time();
			//加仓量为输入值，还钱量为0
			let update_info = ["liquidated",0,0,current_time,req.params.address,req.params.borrow_id];
			let [err2,result2] = await to(psql_db.update_borrows(update_info));

        res.json({ result:result,err:err });
    });




	  wallet.get('/list_borrows/:address',async (req, res) => {
			let address = [req.params.address];
			let [err,result] = await to(psql_db.list_borrows(address));
			res.json({ result:result,err:err });
	  });

	  wallet.get('/matchorder',async (req, res) => {
		
		console.log("2222222222");
		let mist = new mist10(mist10_address);
        walletInst = await getTestInst();
		 mist.unlock(walletInst,"111111")
		await walletInst.queryAllBalance()
        let [err,result] = await to(mist.matchorder(walletInst))
        console.log("333333",result,"444444",err);
        console.log("333333",result,"444444",err);

        res.json({ result:result,err:err });
    });

	  wallet.get('/sendrawtransaction/createDepositBorrow/:borrow_amount/:borrow_time/:deposit_assetID/:deposit_amount/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,txid] = await to(chain.sendrawtransaction(rowtx));
			


		setTimeout(async ()=>{
			let datas = utils.get_receipt(txid);	
			let borrow_id  = parseInt(datas[3],16);
			console.log("444444444",borrow_id);
		//return res.json(datas);
			let current_time = utils.get_current_time();
			let borrow_info = {
				 id:null,
				 //addrss:req.params.address,          
				 address:req.params.address,
				 deposit_assetid:req.params.deposit_assetID,   
				 deposit_amount:req.params.deposit_amount,
				 deposit_token_name:"BTC",
				 deposit_price:60000,
				 interest_rate:0.0148,  
				 cdp_id:borrow_id,            
				 status:"borrowing",            
				 zhiya_rate:0.6,              
				 usage:"炒币",             
				 borrow_amount:req.params.borrow_amount,     
				 borrow_time:req.params.borrow_time,       
				 repaid_amount:0,       
				 updated_at: current_time,
				 created_at: current_time
			};

			borrow_info.id = utils.get_hash(borrow_info);

			let result = await psql_db.insert_borrows(utils.arr_values(borrow_info));
        	res.json({ result:txid,borrow_id:borrow_id});
		}, 10000);
      });

	  wallet.get('/sendrawtransaction/repay/:borrow_id/:asset_id/:amount/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));

			 let current_time = utils.get_current_time();

            //为了复用接口,加仓量为0，还钱量为输入值
            let update_info = ["finished",0,req.params.amount,current_time,req.params.address,req.params.borrow_id];
			console.log("333333333",update_info)
            let [err2,result2] = await to(psql_db.update_borrows(update_info));

            res.json({ result:result,err:err});
      });


	  wallet.get('/sendrawtransaction/cdp_deposit/:borrow_id/:asset_id/:amount/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));

			 let current_time = utils.get_current_time();
            //加仓量为输入值，还钱量为0
            let update_info = ["finished",req.params.amount,0,current_time,req.params.address,req.params.borrow_id];
            let [err2,result2] = await to(psql_db.update_borrows(update_info));

            res.json({ result:result,err:err});
      });



	  wallet.get('/sendrawtransaction/cdp_liquidate/:borrow_id/:asset_id/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));

			let current_time = utils.get_current_time();
            //加仓量为输入值，还钱量为0
            let update_info = ["liquidated",0,0,current_time,req.params.address,req.params.borrow_id];
            let [err2,result2] = await to(psql_db.update_borrows(update_info));

            res.json({ result:result,err:err});
      });




	return wallet;
}
