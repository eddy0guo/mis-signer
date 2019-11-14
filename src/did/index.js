import {
	Router
} from 'express'
import Wallet from '../wallet/classes/Wallet'
import Wallets from "../wallet/service/wallets"
import walletHelper from '../wallet/lib/walletHelper'
import Token from '../wallet/contract/Token'
import Token_did from '../wallet/contract/Token_did'
import mist_wallet1 from '../adex/api/mist_wallet'
import to from 'await-to-js'
import eth from './deposit_withdraw/eth'
import btc from './deposit_withdraw/btc'
import ETHBridge from './bridge/ETHBridge'
import USDTBridge from './bridge/USDTBridge'
import BTCBridge from './bridge/BTCBridge'

import Erc20 from '../wallet/contract/ERC20_did'
var bip39 = require('bip39');
var bip32 = require('bip32');
import {
	HDPrivateKey,
	crypto
} from "bitcore-lib";
var bitcoin = require('bitcoinjs-lib');
let hdkey = require('ethereumjs-wallet/hdkey');
var util = require('ethereumjs-util');

var PromiseBluebird = require('bluebird')
import {
	mist_config
} from '../adex/index';

import dbConfig from './config/database'

let passport = require('passport');
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
const Mail = require('./models/mail.js')
const bcrypt = require('bcrypt-nodejs');


import cdp from '../wallet/contract/cdp'
import adex_utils from '../adex/api/utils'
import psql from '../adex/models/db'
//稍后cdp相关参数存表中,各个币种的利息最小质押都和btc一样，btc价格60000，eth1400，asim666
let asim_address = '0x638f6ee4c805bc7a8558c1cf4df074a38089f6fbfe';

// require('./config/passport')(passport);
import PassportPlugin from './config/passport'
PassportPlugin(passport)

let jwt = require('jsonwebtoken');
let User = require("./models/user");
let user_tx_records = require("./models/user_tx_records");

let payPassword = 'temp-pass-227'
let ex_address = '0x633ef502d57e8cf443dab8fcd9a25dbd891bc20e83'
const seed_word = 'wing safe foster choose wisdom myth quality own gallery logic imitate pink';

let codeObj = {};


async function my_wallet(word) {
	return await walletHelper.testWallet(word, '111111')
}

export default ({
	config,
	db
}) => {
	let router = Router();
	let mist_wallet = new mist_wallet1();
	let psql_db = new psql();
	let utils = new adex_utils();
	let ether = new eth();
	let btcer = new btc();

	function sign(mnemonic, order_id) {
		const seed = bip39.mnemonicToSeedHex(mnemonic);
		const hdPrivateKey = HDPrivateKey.fromSeed(seed).derive(
			`m/44'/10003'/0'/0/0`);
		let privatekey = hdPrivateKey.privateKey.toString();
		console.log("111111-prikey---22", privatekey);

		var hashbuf = Buffer.alloc(32, order_id, 'hex')
		var sig = ECDSA.sign(hashbuf, new bitcore_lib_1.PrivateKey(privatekey))
		let sign_r = ECDSA.sign(hashbuf, new bitcore_lib_1.PrivateKey(privatekey)).r.toString('hex')
		let sign_s = ECDSA.sign(hashbuf, new bitcore_lib_1.PrivateKey(privatekey)).s.toString('hex')
		console.log("sssssssssssss", privatekey);
		let pubkey = new bitcore_lib_1.PrivateKey(privatekey).toPublicKey().toString('hex');
		console.log("sssssssssssss", pubkey);
		let sig_rs = {
			r: sign_r,
			s: sign_s,
			pubkey: pubkey
		};
		console.log("222222sig------", sig_rs);
		return sig_rs;
	}


	router.post('/get_code', async (req, res) => {
		let mail = req.body.mail; //获取数据
		let code = Math.floor(Math.random() * 1000000);
		codeObj[mail] = code;
		console.log(codeObj);
		console.log("3333", codeObj[mail]);
		Mail.send(mail, code, (state) => {
			if (state === 1) {
				res.send('发送ok')
			} else {
				res.send('发送失败')
			}
		})
	})

	router.post('/verify_code', async (req, res) => {
		let mail = req.body.username;
		console.log("-------1111", codeObj[mail], req.body.code);
		if (codeObj[mail] == +req.body.code) {
			res.send({
				success: true
			});
		} else {
			res.send({
				success: false
			});
		}

	})




	router.post('/signup', async (req, res) => {
		if (!req.body.username || !req.body.password) {
			res.json({
				success: false,
				msg: 'Please pass username and password.'
			});
		} else {
			// create wallet

			let mail = req.body.username;

			console.log("-------1111", codeObj[mail], req.body.code);
//			if (codeObj[mail] == +req.body.code) {

				let wallet = new Wallet()
				// 需要激活这个wallet，否则create逻辑有错误
				await Wallets.addWallet(wallet,true)
				//这里直接创建会报错assert 为定义，在库里注释掉了generate address的代码规避
				await wallet.create({
					walletName: "My First Wallet",
					lang: "en",
					mnemonicLength: 12,
					pwd: payPassword
				});
				console.log("signup444---mnemonic", mnemonic);
				let mnemonic = await wallet.getMnemonic(payPassword);
				let walletInst = await walletHelper.testWallet(mnemonic, payPassword);
				let address = await walletInst.getAddress();
				console.log("signup-3333333333333333---address=", address);


				User.find({}).sort({
					'id': -1
				}).limit(1).exec(function (err, docs) {
					// path是btc和eth同时更新共用
					let index = 0
					if (docs && docs[0]) index = docs[0].id + 1
					// 这里处理第一个用户的容错
					const path = "m/0/0/0/0/" + index;

					//const network = bitcoin.networks.bitcoin;
					const network = bitcoin.networks.testnet;
					const btc_seed = bip39.mnemonicToSeed(seed_word, '');
					const root = bip32.fromSeed(btc_seed, network)
					const btc_keyPair = root.derivePath(path)
					let btc_address = bitcoin.payments.p2pkh({
						pubkey: btc_keyPair.publicKey,
						network: network
					})
					console.log("BTC普通地址：", btc_address.address, "id=", path, "\n")

					const eth_seed = bip39.mnemonicToSeedHex(seed_word);
					let hdwallet = hdkey.fromMasterSeed(eth_seed);
					let eth_keypair = hdwallet.derivePath(path);
					let eth_address = util.pubToAddress(eth_keypair._hdkey._publicKey, true);
					console.log('eth地址：', eth_address.toString('hex'))
					console.log("path:", path);

					let newUser = new User({
						username: req.body.username,
						password: req.body.password,
						mnemonic: mnemonic,
						asim_address: address,
						id: index,
						btc_address: btc_address.address,
						eth_address: eth_address.toString('hex')
					});
					// save the user
					newUser.save(function (err) {
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
				});
		/*	} else {
				res.send({
					success: false,
					msg: 'verify mail\'s code fail',
				});
			}*/
		}
	});

	router.post('/modify_password', async (req, res) => {

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
		let mail = req.body.username;
		let password = req.body.new_password;

		console.log("-------1111", codeObj[mail], req.body.code);

		if (codeObj[mail] == +req.body.code) {

			const saltRounds = 10;
			const salt = bcrypt.genSaltSync(saltRounds);
			var hash = bcrypt.hashSync(password, salt);
			password = hash;
			User.update({
				username: mail
			}, {
				password: password
			}, {
				multi: false
			}, async (err, docs) => {
				if (err) console.log(err);
				console.log('更改成功：' + docs);

				res.send({
					success: true,
					msg: 'modify success'
				});
			})


		} else {
			res.send({
				success: false,
				msg: 'code verify failed.2'
			});
		}
	});



	router.post('/signin', async (req, res) => {

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

		let verifyPasswordAsync = PromiseBluebird.promisify(user.comparePassword, {
			context: user
		});
		let [err, isMatch] = await to(verifyPasswordAsync(req.body.password))

		console.log(err, isMatch, user)

		if (isMatch && !err) {
			// if user is found and password is right create a token
			var jwt_payload = {
				_id: user._id
			};
			let jwt_token = jwt.sign(jwt_payload, dbConfig.secret);
			// return the information including token as JSON
			let wallet = await walletHelper.testWallet(user.mnemonic, payPassword)
			let address = await wallet.getAddress()

			// clear info
			user.password = undefined;
			user.mnemonic = undefined;

			res.json({
				success: true,
				user: user,
				token: jwt_token,
				authMessage: address,
				//				approveResults:txids
			});
		} else {
			res.send({
				success: false,
				msg: 'Authentication failed.2'
			});
		}
	});

	//router.post('/order_sign',passport.authenticate('jwt', { session: false }), function(req, res) {
	router.post('/order_sign', function (req, res) {
		console.log("111111", req.body);
		User.findOne({
			username: req.body.username
		}, function (err, user) {
			if (err) throw err;

			if (!user) {
				res.send({
					success: false,
					msg: 'Authentication failed. 1'
				});
			} else {
				let signature = sign(user.mnemonic, req.body.order_id)
				res.json({
					success: true,
					user: user,
					signature: signature
				});
			}
		});
	});

	//借钱
	/*
	let cdp_btc_address = '0x631a4bf19ab8b1a49d75001283316b70cdfee04d7b';
	let cdp_eth_address = '0x6396fb6f5cf3679932520a8728f333e61237e35519';
	let cdp_asim_address = '0x6333052d2e97aca42b6b2a63e792f1fcb2b35298a2';
	*/
	//router.get('/cdp_createDepositBorrow/:borrow_amount/:borrow_time/:deposit_token_name/:deposit_amount/:username',passport.authenticate('jwt', { session: false }),async (req, res) => {
	router.get('/cdp_createDepositBorrow/:borrow_amount/:borrow_time/:deposit_token_name/:deposit_amount/:username', async (req, res) => {
		User.findOne({
			username: req.params.username
		}, async (err, user) => {
			console.log("33333", req.params, "user", user, err);
			let cdp_tokens = await psql_db.find_cdp_token([req.params.deposit_token_name])
			let cdp_address = cdp_tokens[0].cdp_address;
			let deposit_assetID = cdp_tokens[0].token_asset_id;

			let cdp_obj = new cdp(cdp_address);
			let walletInst = await my_wallet(user.mnemonic);
			let address = await walletInst.getAddress();
			cdp_obj.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()

			//let [err,txid] = await to(cdp_obj.createDepositBorrow(3000000000000,1,'000000000000000300000001',1));
			console.log("4444", req.params.borrow_amount * 100000000, req.params.borrow_time / 30, req.params.deposit_amount);
			let [err2, row] = await to(cdp_obj.createDepositBorrow(req.params.borrow_amount * 100000000, req.params.borrow_time / 30, deposit_assetID, req.params.deposit_amount));
			res.json({
				result: row
			});
		});

	});

	router.get("/secret", passport.authenticate('jwt', {
		session: false
	}), function (req, res) {
		console.log('--------------jwt test------------------')
		console.log(req.user)
		console.log('--------------jwt test------------------')
		res.json("Success! You can not see this without a token");
	});


	//还pai，得btc
	//router.get('/cdp_repay/:borrow_id/:token_name/:amount/:username',passport.authenticate('jwt', { session: false }),async (req, res) => {
	router.get('/cdp_repay/:borrow_id/:deposit_token_name/:amount/:username', async (req, res) => {
		console.log("111111", req.params);
		User.findOne({
			username: req.params.username
		}, async (err, user) => {
			//先找到借贷订单信息的充值币中，然后找币的address，
			//	let borrow_id_info  = await psql_db.find_borrow([req.params.borrow_id])
			//	let deposit_token_name = borrow_id_info[0].deposit_token_name;

			let cdp_tokens = await psql_db.find_cdp_token([req.params.deposit_token_name])
			let cdp_address = cdp_tokens[0].cdp_address;
			//这里找pi的信息assetid
			let borrow_token_info = await psql_db.find_cdp_token(['PI'])
			let assetID = borrow_token_info[0].token_asset_id;

			console.log("33333----", cdp_address, assetID);
			let cdp_obj = new cdp(cdp_address);
			let walletInst = await my_wallet(user.mnemonic);
			let address = await walletInst.getAddress();

			cdp_obj.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()

			//let [err2,row] = await to(cdp_obj.repay(+req.params.borrow_id,assetID,+req.params.amount));
			let [err2, row] = await to(cdp_obj.repay(req.params.borrow_id, assetID, req.params.amount));
			res.json({
				result: row
			});
		});
	});

	//加仓
	router.get('/cdp_deposit/:borrow_id/:token_name/:amount/:username',
		passport.authenticate('jwt', {
			session: false
		}), async (req, res) => {

			let user = req.user

			let cdp_tokens = await psql_db.find_cdp_token([req.params.token_name])
			let cdp_address = cdp_tokens[0].cdp_address;
			let assetID = cdp_tokens[0].token_asset_id;

			let cdp_obj = new cdp(cdp_address);
			let walletInst = await my_wallet(user.mnemonic);
			// let address = await walletInst.getAddress();

			cdp_obj.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()
			console.log("- cdp_deposit --", req.params);
			//let [err2,row]  = await to(cdp_obj.deposit(41,'000000000000001e00000001',60));
			let [err2, row] = await to(cdp_obj.deposit(req.params.borrow_id, assetID, req.params.amount));
			res.json({
				result: row
			});
		});


	//清仓
	router.get('/cdp_liquidate/:borrow_id/:asset_id/:username',
		passport.authenticate('jwt', {
			session: false
		}), async (req, res) => {

			let user = req.user
			let cdp_obj = new cdp(cdp_address);
			let walletInst = await my_wallet(user.mnemonic);
			let address = await walletInst.getAddress();

			cdp_obj.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()

			let [err2, row] = await to(cdp_obj.liquidate(req.params.borrow_id, req.params.asset_id));
			console.log(row, err2);
			res.json({
				result: row
			});
		});


	//钱包到币币
	//router.get('/asim_deposit/:amount/:username/:token_name',passport.authenticate('jwt', { session: false }),async (req, res) => {
	router.get('/asset2coin/:amount/:username/:token_name', async (req, res) => {
	//router.get('/asim_deposit/:amount/:username/:token_name', async (req, res) => {
		console.log("33333");
		User.findOne({
			username: req.params.username
		}, async (err, user) => {

			// let erc20 = new Erc20(asim_address);
			let walletInst = await my_wallet(user.mnemonic);
			let tokens = await psql_db.get_tokens([req.params.token_name])
			console.log("7777777", tokens);
			//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
			let erc20 = new Erc20(tokens[0].address);
			erc20.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()
			let [err2, result] = await to(erc20.deposit(tokens[0].asim_assetid, req.params.amount));
			console.log(result, err);


			res.json({
				result: result,
				err: err2
			});
		});
	});


	//币币到钱包
	//router.get('/asim_withdraw/:amount/:username/:token_name',passport.authenticate('jwt', { session: false }),async (req, res) => {
	router.get('/coin2asset/:amount/:username/:token_name', async (req, res) => {
	//router.get('/asim_withdraw/:amount/:username/:token_name', async (req, res) => {
		User.findOne({
			username: req.params.username
		}, async (err, user) => {

			// let erc20 = new Erc20(asim_address);
			let walletInst = await my_wallet(user.mnemonic);
			//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
			let tokens = await psql_db.get_tokens([req.params.token_name])
			let erc20 = new Erc20(tokens[0].address);
			erc20.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()
			//这里为了和deposit保持单位一致
			let [err2, result] = await to(erc20.withdraw(tokens[0].asim_assetid, req.params.amount * Math.pow(10, 8)));

			console.log(result, err2);

			res.json({
				result: result,
				err: err
			});
		});
	});

	//交易所充币
	//展示二维码之后1分钟后开始监控，1分钟之内要完成充值,暂时不支持连续充值
	router.get('/deposit/:username/:token_name', async (req, res) => {
		console.log("33333");
		User.findOne({
			username: req.params.username
		}, async (err, user) => {

			let token_name = req.params.token_name;
			if (token_name == 'ETH') {
				//ether.start_deposit(user);
				console.log("txs----------------",user);
				let ethBridge = new ETHBridge(user.asim_address,"0x" + user.eth_address);
				ethBridge.start(60*1000);
			} else if (token_name == 'BTC') {
				let btcBridge = new BTCBridge(user.asim_address,"0x" + user.btc_address);
				btcBridge.start(60*1000);
				console.log("deposit btc");
			} else if (token_name == 'USDT') {
				console.log("deposit usdt");
				console.log("txs----------------",user);
				let usdtBridge = new USDTBridge(user.asim_address,"0x" + user.eth_address);
				usdtBridge.start(60*1000);
			} else {
				return res.json({
					result: "cannot support token"
				});
			}
		});
	});


	//交易所提币
	router.get('/withdraw/:amount/:username/to_address/token_name', async (req, res) => {
		User.findOne({
			username: req.params.username
		}, async (err, user) => {

			let erc20 = new Erc20(asim_address);
			let walletInst = await my_wallet(user.mnemonic);
			//walletHelper.testWallet('wing safe foster choose wisdom myth quality own gallery logic imitate pink','111111')
			erc20.unlock(walletInst, "111111")
			await walletInst.queryAllBalance()
			//这里为了和deposit保持单位一致
			let [err2, result] = await to(erc20.withdraw(req.params.amount * Math.pow(10, 8)));

			console.log(result, err2);

			res.json({
				result: result,
				err: err
			});
		});
	});
	router.get('/approve/:username/:token_name', passport.authenticate('jwt', {
		session: false
	}), async (req, res) => {
		User.findOne({
			username: req.params.username
		}, async (err, user) => {

			let wallet = await walletHelper.testWallet(user.mnemonic, payPassword);
			let token_info = await psql_db.get_tokens([req.params.token_name])
			let token = new Token_did(token_info[0].address);
			token.unlock(wallet, payPassword)
			await wallet.queryAllBalance()
			let [err2, rawtx] = await to(token.approve(mist_config.ex_address, 90 * 10 ** 13));
			console.log("444--", err2, rawtx);
			res.json({
				result: rawtx,
				err: err2
			});
		});
	});






	return router;
}
