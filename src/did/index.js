import { Router } from 'express'
import Wallet from '../wallet/classes/Wallet'
import walletHelper from '../wallet/lib/walletHelper'

var PromiseBluebird = require('bluebird')

let passport = require('passport');
require('./config/passport')(passport);
let jwt = require('jsonwebtoken');
let User = require("./models/user");

let payPassword = 'temp-pass-227'

export default ({ config, db }) => {
	let router = Router();

	router.get('/signup', async (req, res) => {
		if (!req.body.username || !req.body.password) {
			res.json({
				success: false,
				msg: 'Please pass username and password.'
			});
		} else {
			// create wallet
			let wallet = new Wallet();
			
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
				mnemonic: mnemonic
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
					msg: 'Successful created new user.'
				});
			});
		}
	});

	router.get('/signin',async (req, res) => {

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

		let verifyPasswordAsync = PromiseBluebird.promisify(user.verifyPassword, { context: user });
		let isMatch = await verifyPasswordAsync(req.body.password)
		
		if (isMatch ) {
			// if user is found and password is right create a token
			let token = jwt.sign(user, config.secret);
			// return the information including token as JSON
			let wallet = await walletHelper.testWallet(user.mnemonic,payPassword)
			let address = await wallet.getAddress()

			user.password = undefined;
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
