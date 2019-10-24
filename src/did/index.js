import { Router } from 'express'
import Wallet from '../wallet/classes/Wallet'
import Wallets from "../wallet/service/wallets"
import walletHelper from '../wallet/lib/walletHelper'
import Token from '../wallet/contract/Token'
import mist_wallet1 from '../adex/api/mist_wallet'
import to from 'await-to-js'
import Erc20 from '../wallet/contract/ERC20_did'
var bip39 = require('bip39');
var bip32 = require('bip32');
import { HDPrivateKey, crypto } from "bitcore-lib";
var bitcoin = require('bitcoinjs-lib');
let hdkey = require('ethereumjs-wallet/hdkey');
var util =require('ethereumjs-util');

var PromiseBluebird = require('bluebird')

let dbConfig = require('./config/database')
let passport = require('passport');
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;


import cdp from '../wallet/contract/cdp'
import adex_utils from '../adex/api/utils'
import psql from '../adex/models/db'
let cdp_address = '0x6367f3c53e65cce5769166619aa15e7da5acf9623d';
let asim_address = '0x638f6ee4c805bc7a8558c1cf4df074a38089f6fbfe';




require('./config/passport')(passport);
let jwt = require('jsonwebtoken');
let User = require("./models/user");

let payPassword = 'temp-pass-227'
let ex_address = '0x63b2b7e3ec2d1d1b171a3c14032bd304367e538a68'
const eth_seed_word = 0x649f1f2d874fbba7f298f5227f23f08bbad4791c366d68a74275b47f0bdb9a3b78777d17020d7621bd0c5f321d764ad9e7a7f3fd597eea39f94e72fea1aeb28f;
const seed_word = 'wing safe foster choose wisdom myth quality own gallery logic imitate pink';
let btc_seed =1;

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}

export default ({ config, db }) => {
	let router = Router();
	let mist_wallet = new mist_wallet1();
	 let psql_db = new psql();
    let utils = new adex_utils();

	function sign(mnemonic,order_id){
			const seed = bip39.mnemonicToSeedHex(mnemonic);
			const hdPrivateKey = HDPrivateKey.fromSeed(seed).derive(
      `m/44'/10003'/0'/0/0`);
			let privatekey = hdPrivateKey.privateKey.toString();
		    console.log("111111-prikey---22",privatekey);

           var hashbuf=Buffer.alloc(32,order_id,'hex')
          var sig = ECDSA.sign(hashbuf, new bitcore_lib_1.PrivateKey(privatekey))
           let sign_r = ECDSA.sign(hashbuf,new bitcore_lib_1.PrivateKey(privatekey)).r.toString('hex')
           let sign_s = ECDSA.sign(hashbuf,new bitcore_lib_1.PrivateKey(privatekey)).s.toString('hex')
		   console.log("sssssssssssss",privatekey);
		   let  pubkey = new bitcore_lib_1.PrivateKey(privatekey).toPublicKey().toString('hex');
		   console.log("sssssssssssss",pubkey);
		   let sig_rs = {
        	   r: sign_r,
        	   s: sign_s,
			   pubkey: pubkey
        	 };
			 console.log("222222sig------",sig_rs);
		    return sig_rs;
 }

	router.post('/signup', async (req, res) => {
		if (!req.body.username || !req.body.password) {
			res.json({
				success: false,
				msg: 'Please pass username and password.'
			});
		} else {
			// create wallet
			let wallet = new Wallet();
//这里直接创建会报错assert 为定义，在库里注释掉了generate address的代码规避
			await wallet.create({
				walletName: "My First Wallet",
				lang: "en",
				mnemonicLength: 12,
				pwd: payPassword
			});
		 	console.log("signup444---mnemonic",mnemonic);
			let mnemonic = await wallet.getMnemonic(payPassword);
			let  walletInst = await walletHelper.testWallet(mnemonic,payPassword);
			let address = await walletInst.getAddress();
		 	console.log("signup-3333333333333333---address=",address);

			
				User.find({}).sort({'id':-1}).limit(1).exec(function(err,docs){
				// path是btc和eth同时更新共用
				let index = 0
				if(docs&&docs[0]) index = docs[0].id + 1
				// 这里处理第一个用户的容错
				const path = "m/0/0/0/0/" + index;

				const network = bitcoin.networks.bitcoin;
				const btc_seed = bip39.mnemonicToSeed(seed_word,'');
				const root = bip32.fromSeed(btc_seed,network)
				const btc_keyPair = root.derivePath(path)
				let btc_address = bitcoin.payments.p2pkh({ pubkey: btc_keyPair.publicKey , network:network})
				console.log("BTC普通地址：", btc_address.address, "id=",path,"\n")

				const eth_seed = bip39.mnemonicToSeedHex(seed_word);
				let hdwallet = hdkey.fromMasterSeed(eth_seed);
				let eth_keypair = hdwallet.derivePath(path);
        		let eth_address = util.pubToAddress(eth_keypair._hdkey._publicKey, true);
        		console.log('eth地址：', eth_address.toString('hex'))
				console.log("path:",path);

				let newUser = new User({
					username: req.body.username,
					password: req.body.password,
					mnemonic: mnemonic,
					address: address,
					id: index,
					btc_address: btc_address.address,
					eth_address: eth_address.toString('hex')
				});
				// save the user
				newUser.save(function(err) {
					if (err) {
						return res.json({
							success: false,
							msg: 'Username already exists.'
						});
					}
					
					res.json({
						success: true,
						msg: 'Successful created new user.',
						address: address
					});
				  });
				}
			);
		}
	});

	router.post('/signin',async (req, res) => {

		let user = await User.findOne({
			username: req.body.username
		})

		if (!user) {
			res.send({
				success: false,
				msg: 'Authentication failed. 1'
			})
			return
		}

		let verifyPasswordAsync = PromiseBluebird.promisify(user.comparePassword, { context: user });
		let [err,isMatch] = await to(verifyPasswordAsync(req.body.password))
		
		console.log(err,isMatch,user)

		if (isMatch && !err ) {
			// if user is found and password is right create a token
			var jwt_payload = {_id: user._id};
			let jwt_token = jwt.sign(jwt_payload, dbConfig.secret);
			// return the information including token as JSON
			let wallet = await walletHelper.testWallet(user.mnemonic,payPassword)
			let address = await wallet.getAddress()


			let token_arr = await mist_wallet.list_tokens();
			let txids =[];
			for(let i in token_arr){
							let token  = new Token(token_arr[i].address);

							console.log("333--address",address);

							 token.unlock(wallet,payPassword)
							let [err,balance] = await to(token.balanceOf(address));
							let [err3,allowance] = await to(token.allowance(address,ex_address));
							if(balance != allowance){
								await wallet.queryAllBalance()
								let [err2,txid] = await to(token.approve(ex_address,balance));
								txids.push(txid);
								console.log("444--",err2,txid);

							}
							console.log("444--",balance,allowance);
			}


			// clear info
			user.password = undefined;
			user.mnemonic = undefined;

			res.json({
				success: true,
				user: user,
				token: jwt_token,
				authMessage: address,
				approveResults:txids
			});
		} else {
			res.send({
				success: false,
				msg: 'Authentication failed.2'
			});
		}
	});

	router.post('/order_sign', function(req, res) {
		console.log("111111",req.body);
		User.findOne({
			username: req.body.username
		}, function(err, user) {
			if (err) throw err;

			if (!user) {
				res.send({
					success: false,
					msg: 'Authentication failed. 1'
				});
			} else {
				let signature = sign(user.mnemonic,req.body.order_id)
				res.json({
					success: true,
					user: user,
					signature:signature
				});
			}
		});
	});

	router.get('/cdp_createDepositBorrow/:borrow_amount/:borrow_time/:deposit_assetID/:deposit_amount/:username',async (req, res) => {
		User.findOne({
            username: req.params.username
        }, async (err, user) => {
        console.log("33333",req.params,"user",user,err);
        let cdp_obj = new cdp(cdp_address);
        let walletInst = await my_wallet(user.mnemonic);
		let address = await walletInst.getAddress();
         cdp_obj.unlock(walletInst,"111111")
        await walletInst.queryAllBalance()

        //let [err,txid] = await to(cdp_obj.createDepositBorrow(3000000000000,1,'000000000000000300000001',1));
        console.log("4444",req.params.borrow_amount*100000000,req.params.borrow_time/30);
        let [err2,row] = await to(cdp_obj.createDepositBorrow(req.params.borrow_amount*100000000,req.params.borrow_time/30,req.params.deposit_assetID,req.params.deposit_amount));
            res.json({ result:row});
		});

    });	

	router.get("/secret", passport.authenticate('jwt', { session: false }), function(req, res){
		console.log('--------------jwt test------------------')
		console.log(req.user)
		console.log('--------------jwt test------------------')
		res.json("Success! You can not see this without a token");
	});

	
        //还pai，得btc
    router.get('/cdp_repay/:borrow_id/:asset_id/:amount/:username',async (req, res) => {
		console.log("111111",req.params);
        User.findOne({
            username: req.params.username
        }, async (err, user) => {

        console.log("33333");
        let cdp_obj = new cdp(cdp_address);
		    let walletInst = await my_wallet(user.mnemonic);
        let address = await walletInst.getAddress();

         cdp_obj.unlock(walletInst,"111111")
        await walletInst.queryAllBalance()

        let [err2,row] = await to(cdp_obj.repay(req.params.borrow_id,req.params.asset_id,req.params.amount));
        res.json({ result:row });
		});
    });

//加仓
  	router.get('/cdp_deposit/:borrow_id/:asset_id/:amount/:username',async (req, res) => {

        console.log("33333");
		 User.findOne({
            username: req.params.username
        }, async (err, user) => {

        let cdp_obj = new cdp(cdp_address);
		    let walletInst = await my_wallet(user.mnemonic);
        let address = await walletInst.getAddress();

         cdp_obj.unlock(walletInst,"111111")
        await walletInst.queryAllBalance()

        let [err2,row]  = await to(cdp_obj.deposit(req.params.borrow_id,req.params.asset_id,req.params.amount));
       res.json({ result:row});
		});
    });


//清仓
    router.get('/cdp_liquidate/:borrow_id/:asset_id/:username',async (req, res) => {

        console.log("33333");
		 User.findOne({
            username: req.params.username
        }, async (err, user) => {

        let cdp_obj = new cdp(cdp_address);
  		  let walletInst = await my_wallet(user.mnemonic);
        let address = await walletInst.getAddress();



         cdp_obj.unlock(walletInst,"111111")
        await walletInst.queryAllBalance()

        let [err2,row] = await to(cdp_obj.liquidate(req.params.borrow_id,req.params.asset_id));
        console.log(row,err2);
        res.json({ result:row});
		});
    });


 //钱包到币币
   router.get('/deposit/:amount/:username',async (req, res) => {
	     console.log("33333");
         User.findOne({
            username: req.params.username
        }, async (err, user) => {

        let erc20 = new Erc20(asim_address);
          let walletInst = await my_wallet(user.mnemonic);
        //walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
        erc20.unlock(walletInst,"111111")
        await walletInst.queryAllBalance()
       let [err2,result] = await to(erc20.deposit(req.params.amount));
        console.log(result,err);

    
        res.json({ result:result,err:err2 }); 
  		 });
    }); 


    //币币到钱包
   router.get('/withdraw/:amount/:username',async (req, res) => {
		User.findOne({
            username: req.params.username
        }, async (err, user) => {

        let erc20 = new Erc20(asim_address);
          let walletInst = await my_wallet(user.mnemonic);
        //walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
        erc20.unlock(walletInst,"111111")
          await walletInst.queryAllBalance()
        //这里为了和deposit保持单位一致
       let [err2,result] = await to(erc20.withdraw(req.params.amount * Math.pow(10,8)));

        console.log(result,err2);
    
        res.json({ result:result,err:err }); 
		});
    });


	return router;
}
