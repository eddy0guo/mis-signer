import { Router } from 'express'
import Wallet from '../wallet/classes/Wallet'
import Wallets from "../wallet/service/wallets"
import walletHelper from '../wallet/lib/walletHelper'
import Token from '../wallet/contract/Token'
import mist_wallet1 from '../adex/api/mist_wallet'
import to from 'await-to-js'

var PromiseBluebird = require('bluebird')

let dbConfig = require('./config/database')
let passport = require('passport');
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;

require('./config/passport')(passport);
let jwt = require('jsonwebtoken');
let User = require("./models/user");

let payPassword = 'temp-pass-227'
let ex_address = '0x63d2007ae83b2853d85c5bd556197e09ca4d52d9c9'

export default ({ config, db }) => {
	let router = Router();
	let mist_wallet = new mist_wallet1();

	function sign(privatekey,order_id){
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
//			await Wallets.addWallet(wallet,true)
//			let address = await wallet.getAddress()
//这里直接创建会报错assert 为定义，在库里注释掉了generate address的代码规避
			await wallet.create({
				walletName: "My First Wallet",
				lang: "en",
				mnemonicLength: 12,
				pwd: payPassword
			});
//			await Wallets.addWallet(wallet,true)
//			let address = await wallet.getAddress()

		 	console.log("signup444---mnemonic",mnemonic);
			let mnemonic = await wallet.getMnemonic(payPassword);
			let  walletInst = await walletHelper.testWallet(mnemonic,payPassword);
			let address = await walletInst.getAddress();
		 	console.log("signup-3333333333333333---address=",address);

			let newUser = new User({
				username: req.body.username,
				password: req.body.password,
				mnemonic: mnemonic,
				address: address,
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
			let token = jwt.sign(user.toJSON(), dbConfig.secret);
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
				token: 'JWT ' + token,
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
				user.privatekey = '0190aa58022d3879bac447427723ce7f1df4cf89f1048d32e377cd893be5a325';
				let signature = sign(user.privatekey,req.body.order_id)
				res.json({
					success: true,
					user: user,
					signature:signature
				});
			}
		});
	});

	return router;
}
