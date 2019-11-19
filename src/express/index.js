import to from 'await-to-js'
import TokenTest from '../wallet/contract/TokenTest'
import Token from '../wallet/contract/Token'

import walletHelper from '../wallet/lib/walletHelper'
import { Router } from 'express'

import NP from 'number-precision'
import client1 from './models/db'

import mist_wallet1 from './api/mist_wallet'
const urllib = require('url');
import mist_config from '../cfg'

import apicache from 'apicache'
let cache = apicache.middleware

async function my_wallet(word){
                return await walletHelper.testWallet(word,'111111')
}


export default ({ config, db }) => {

	light.get('/list_market', async (req, res) => {
					 let result = await trades.get_engine_info();
                    console.log(result)
       res.json({result});
	});


	light.get('/my_records', async (req, res) => {
					 let result = await trades.get_engine_info();
                    console.log(result)
       res.json({result});
	});

	light.get('/build_convert', async (req, res) => {
					 let result = await trades.get_engine_info();
                    console.log(result)
       res.json({result});
	});

	return light;
};
