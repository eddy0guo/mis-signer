import { Router } from 'express'
import Wallet from '../wallet/classes/Wallet'
import Wallets from "../wallet/service/wallets"
import walletHelper from '../wallet/lib/walletHelper'
import to from 'await-to-js'

var PromiseBluebird = require('bluebird')

let dbConfig = require('./config/database')
let passport = require('passport');
require('./config/passport')(passport);
let jwt = require('jsonwebtoken');
let User = require("./models/user");

let payPassword = 'temp-pass-227'

export default ({ config, db }) => {
	let router = Router();

	router.post('/signup', async (req, res) => {
		if (!req.body.username || !req.body.password) {
			res.json({
				success: false,
				msg: 'Please pass username and password.'
			});
		} else {
			// create wallet
			let wallet = new Wallet();
			await Wallets.addWallet(wallet,true)
			let address = await wallet.getAddress()

			await wallet.create({
				walletName: "My First Wallet",
				lang: "en",
				mnemonicLength: 12,
				pwd: payPassword
			});

			let mnemonic = wallet.getMnemonic(payPassword);

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

			// clear info
			user.password = undefined;
			user.mnemonic = undefined;

			res.json({
				success: true,
				user: user,
				token: 'JWT ' + token,
				authMessage: address
			});
		} else {
			res.send({
				success: false,
				msg: 'Authentication failed.2'
			});
		}
	});

	return router;
}
