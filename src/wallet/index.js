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
import Token from '../wallet/contract/Token'

import Erc20 from './contract/ERC20'
import Erc20Test from './contract/ERC20Test'

import mist10 from './contract/mist_ex10'
import cdp from './contract/cdp'
import adex_utils from '../adex/api/utils'
import psql from '../adex/models/db'
import mist_wallet1 from '../adex/api/mist_wallet'
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
let asim_address = '0x638f6ee4c805bc7a8558c1cf4df074a38089f6fbfe';
let mist10_address = '0x63b2b7e3ec2d1d1b171a3c14032bd304367e538a68';
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
	let mist_wallet = new mist_wallet1();

	wallet.get('/', async (req, res) => {
		walletInst = await getTestInst();
		let address = await walletInst.getAddress()
		res.json({ wallet:address })
	});

	wallet.get('/faucet2/:token/:address',async (req, res) => {
		console.log(req.params)
		let token = new StandardToken(req.params.token)
		let takerWallet = await getTakerWallet();
		await takerWallet.queryAllBalance()
		token.unlock(takerWallet,'111111')
		let [err,result] = await to(token.transfer(req.params.address,10000))
		console.log(result,err);
		res.json({ result:result,err:err });
	});

	wallet.get('/faucet/:address',async (req, res) => {
		console.log(req.params)
		let wallet = await getTestInst();
		let address = req.params.address; 
		let token_arr = await mist_wallet.list_tokens();
	//	let asset_token_arr = ['000000000000000000000000','000000000000001b00000001','000000000000001c00000001','000000000000001d00000001','000000000000001e00000001','000000000000001f00000001']
		/*
		for(let i in erc20_token_arr){
				  setTimeout(async ()=>{
					let token  = new Token(erc20_token_arr[i].address);
					console.log("333--address",address);
					await wallet.queryAllBalance()
					token.unlock(wallet,'111111')
					let [err,result] = await to(token.transfer(req.params.address,10000))
					console.log("---------erc20_token_arr--i=",i,"err-result",err,result,"\n\n\n\n")
				  },i*10000)
		}
*/
		let results = [];	
		 for(let i in  token_arr){
			 setTimeout(async ()=>{
			let asset = new Asset(token_arr[i].asim_assetid)	
			asset.unlock(wallet,"111111")
			await wallet.queryAllBalance()
			let [err,result] = await to(asset.transfer(address,100000));

			 results.push[result];
			console.log("---------erc20_token_arr--i=",i,"err-result",err,result,"\n\n\n\n")
			 },i*10000);
		}
		
		console.log(results);
		res.json({ result:results});
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

        res.json({ result:result,err:err });
    });

	  wallet.get('/sendrawtransaction/createDepositBorrow/:borrow_amount/:borrow_time/:token_name/:deposit_amount/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,txid] = await to(chain.sendrawtransaction(rowtx));
						


		setTimeout(async ()=>{
			let datas = utils.get_receipt(txid);	
			console.log("444444444",datas[3].slice(194,258));
			let borrow_id  = parseInt(datas[3].slice(194,258),16);
			console.log("444444444",borrow_id);
		let cdp_tokens = await psql_db.find_cdp_token([req.params.token_name])
        let cdp_address =  cdp_tokens[0].cdp_address;

        let assetID = cdp_tokens[0].token_asset_id;
		//根据借贷时间去表中查对于的利率，临时先这么处理，4为字段的排序
		let index = (req.params.borrow_time/30) + 3;
		let token_info_arr = utils.arr_values(cdp_tokens[0]);
		let interest_rate = token_info_arr[index];
		console.log("---44444-interest_rate--",interest_rate);	

		//return res.json(datas);
			let current_time = utils.get_current_time();
			let mortgage_rate = req.params.borrow_amount / (req.params.deposit_amount * 60000);
			let should_repaid_amount = req.params.borrow_amount * (1 + (+interest_rate));

			let borrow_info = {
				 id:null,
				 //addrss:req.params.address,          
				 address:req.params.address,
				 deposit_assetid:assetID,   
				 deposit_amount:req.params.deposit_amount,
				 deposit_token_name:req.params.token_name,
				 deposit_price:60000, //后边接入行情api
				 interest_rate: interest_rate,
				 cdp_id:borrow_id,            
				 status:"borrowing",            
				 mortgage_rate:mortgage_rate,              
				 usage:"炒币",             
				 borrow_amount: req.params.borrow_amount,     
				 borrow_time: req.params.borrow_time,       
				 repaid_amount:0,       
				 should_repaid_amount:should_repaid_amount,       
				 updated_at: current_time,
				 created_at: current_time
			};

			borrow_info.id = utils.get_hash(borrow_info);
		
			console.log("--555555-interest_rate--",borrow_info);	
			let result = await psql_db.insert_borrows(utils.arr_values(borrow_info));
        	res.json({ result:txid,borrow_id:borrow_id});
		}, 10000);
      });

//	还钱
	  wallet.get('/sendrawtransaction/repay/:borrow_id/:token_name/:amount/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));

			 let current_time = utils.get_current_time();

            let [err2,borrow_info] = await to(psql_db.find_borrow([req.params.borrow_id]));
			let status = "borrowing";
			let repay_amount = req.params.amount;
			//这里会有点小bug-因为利率的数值最后一个是进一的,如果还钱金额正好是介于psql数据库里应还和kv数据库里之间
			//则实际已经还款完成，psql显示还差零点几个带还款
			
			if(repay_amount  >= borrow_info[0].should_repaid_amount){
				status = "finished";
				repay_amount = borrow_info[0].should_repaid_amount;
			}

            //为了复用接口,加仓量为0，还钱量为输入值
            let update_info = ["finished",0,repay_amount,current_time,req.params.address,req.params.borrow_id];
			console.log("333333333",update_info)
            let [err3,result2] = await to(psql_db.update_borrows(update_info));

            res.json({ result:result,err:err});
      });
//加仓

	  wallet.get('/sendrawtransaction/cdp_deposit/:borrow_id/:token_name/:amount/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));

			 let current_time = utils.get_current_time();
            //加仓量为输入值，还钱量为0
            let update_info = ["borrowing",req.params.amount,0,current_time,req.params.address,req.params.borrow_id];
            let [err2,result2] = await to(psql_db.update_borrows(update_info));

            res.json({ result:result,err:err});
      });


//清仓
	  wallet.get('/sendrawtransaction/cdp_liquidate/:borrow_id/:asset_id/:address/:row',async (req, res) => {
            let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));

			let current_time = utils.get_current_time();
            //加仓量为输入值，还钱量为0
            let update_info = ["liquidated",0,0,current_time,req.params.address,req.params.borrow_id];
            let [err2,result2] = await to(psql_db.update_borrows(update_info));

            res.json({ result:result,err:err});
      });


	  wallet.get('/sendrawtransaction/:row',async (req, res) => {
	   let rowtx = [req.params.row];
            let [err,result] = await to(chain.sendrawtransaction(rowtx));
            res.json({ result:result,err:err});
		});


	return wallet;
}
