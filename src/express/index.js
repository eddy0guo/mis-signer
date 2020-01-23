import to from 'await-to-js'
import NP from 'number-precision'
import { Router } from 'express'

import { chain } from '../wallet/api/chain'
import walletHelper from '../wallet/lib/walletHelper'
import Asset from '../wallet//asset/Asset'

import mist_wallet1 from '../adex/api/mist_wallet'
import order1 from '../adex/api/order'
import utils1 from '../adex/api/utils'
import psql from './models/db'

import mist_config from '../cfg'

let express_config = [
    {
        token: "CNYC",
        min: 60,
        max: 60000,
    }, {
        token: "USDT",
        min: 10,
        max: 10000,
    }, {
        token: "ASIM",
        min: 1,
        max: 1000,
    }, {
        token: "MT",
        min: 1,
        max: 1000,
    }, {
        token: "ETH",
        min: 0.06,
        max: 60,
    }, {
        token: "BTC",
        min: 0.001,
        max: 1,
    }
]

async function my_wallet(word) {
    return await walletHelper.testWallet(word, '111111')
}

async function get_price(base_token_name, quote_token_name, amount, order) {
    let base_value = 0;
    let base_amount = 0;
    if (base_token_name != 'CNYC') {
        let base_book = await order.order_book(base_token_name + '-CNYC');
        let base_bids = base_book.bids;
        //模拟先卖掉所有base，再全部买quote
        for (let index in base_bids) {
            let tmp_amount = base_amount;
            base_amount += (+base_bids[index][1]);
            if (base_amount >= amount) {
                base_value += NP.times(amount - tmp_amount, base_bids[index][0])
                break;
            } else {
                //amount * price
                base_value += NP.times(base_bids[index][1], base_bids[index][0])
            }

        }
    } else {
        base_value = NP.times(amount, 1);
    }

    let quote_value = 0;
    let quote_amount = 0;
    if (quote_token_name != 'CNYC') {
        let quote_book = await order.order_book(quote_token_name + '-CNYC');
        let quote_asks = quote_book.asks.reverse();

        for (let index in quote_asks) {
            let tmp_value = quote_value;
            quote_value += NP.times(quote_asks[index][1], quote_asks[index][0])

            if (quote_value >= base_value) {
                quote_amount += NP.divide(base_value - tmp_value, quote_asks[index][0]);
                break;
            } else {
                //amount * price
                quote_amount += (+quote_asks[index][1]);
            }

        }
    } else {
        quote_amount = NP.divide(base_value, 1)
    }
    let price = NP.divide(quote_amount, amount).toFixed(8);
    return price;
}

export default () => {
    let express = Router();
    let mist_wallet = new mist_wallet1();
    let psql_db = new psql();
    let utils = new utils1();
    let order = new order1(psql_db);

    /**
     * @api {post} /express/my_records/:page/:perpage 用户兑换记录
     * @apiDescription 用户登录
     * @apiName my_records
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
	 "success": true,
    "result": [
        {
            "trade_id": "4e6b881de2eb3b9e8bdb4baefac9d5182c54eb274c821ca43e04301c9a7e2497",
            "address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
            "base_asset_name": "ETH",
            "base_amount": 0.01,
            "price": 141.9571231,
            "quote_asset_name": "USDT",
            "quote_amount": 1.41247337,
            "fee_rate": 0.005,
            "fee_token": "USDT",
            "fee_amount": 0.00709786,
            "base_txid": null,
            "base_tx_status": "failed",
            "quote_txid": null,
            "quote_tx_status": null,
            "updated_at": "2019-12-16T06:43:29.022Z",
            "created_at": "2019-12-16T06:43:29.022Z",
            "base_token_icon": "https://www.mist.exchange/res/icons/ETHa.png",
            "quote_token_icon": "https://www.mist.exchange/res/icons/USDTa.png"
        }
    ],
    "err": null

     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/my_records/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/3
     * @apiVersion 1.0.0
     */
    express.all('/my_records/:address/:page/:perpage', async (req, res) => {
        let { address, page, perpage } = req.params;
        let offset = (+page - 1) * +perpage;
        let [err, records] = await to(psql_db.my_express([address, offset, perpage]));

        for (let record of records) {
            record.base_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record.base_asset_name + 'a.png'
            record.quote_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record.quote_asset_name + 'a.png'
        }
        res.json({
            success: records == undefined ? false : true,
            result: records,
            err: err
        });
    });

    /**
     * @api {post} /express/get_express_trade/:trade_id 获取单个交易详情
     * @apiDescription 获取单个交易详情
     * @apiName get_express_trade
     * @apiGroup express
     * @apiParam {string} trade_id 交易ID
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
	 "success": true,
    "result": 
        {
            "trade_id": "4e6b881de2eb3b9e8bdb4baefac9d5182c54eb274c821ca43e04301c9a7e2497",
            "address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
            "base_asset_name": "ETH",
            "base_amount": 0.01,
            "price": 141.9571231,
            "quote_asset_name": "USDT",
            "quote_amount": 1.41247337,
            "fee_rate": 0.005,
            "fee_token": "USDT",
            "fee_amount": 0.00709786,
            "base_txid": null,
            "base_tx_status": "failed",
            "quote_txid": null,
            "quote_tx_status": null,
            "updated_at": "2019-12-16T06:43:29.022Z",
            "created_at": "2019-12-16T06:43:29.022Z",
            "base_token_icon": "https://www.mist.exchange/res/icons/ETHa.png",
            "quote_token_icon": "https://www.mist.exchange/res/icons/USDTa.png"
        },
    "err": null

     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/get_express_trade/4e6b881de2eb3b9e8bdb4baefac9d5182c54eb274c821ca43e04301c9a7e2497
     * @apiVersion 1.0.0
     */


    express.all('/get_express_trade/:trade_id', async (req, res) => {
        let { trade_id } = req.params;
        let [err, record] = await to(psql_db.find_express([trade_id]));
        if (err) {
            return res.json({
                success: false,
                err: err
            })
        }

        if (record.length == 0) {
            return res.json({
                success: true,
                result: []
            })
        }

        if (record[0].base_asset_name && record[0].quote_asset_name) {
            record[0].base_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record[0].base_asset_name + 'a.png'
            record[0].quote_token_icon = 'http://fingo-cdn.asimov.work/res/icons/' + record[0].quote_asset_name + 'a.png'
        } else {
            record[0].base_token_icon = null;
            record[0].quote_token_icon = null;
        }
        res.json({
            success: true,
            result: record[0],
            err: err
        });
    });

    /**
     * @api {post} /express/config
     * @apiDescription 获取手续费详情
     * @apiName config
     * @apiGroup express
     * @apiSuccess {json} result
     @apiPermission token
     * @apiSuccessExample {json} Success-Response:
     *  {
		"success": true,
    "result": [
        {
            "token": "CNYC",
            "min": 60,
            "max": 60000
        },
        {
            "token": "USDT",
            "min": 10,
            "max": 10000
        },
        {
            "token": "ASIM",
            "min": 1,
            "max": 1000
        },
        {
            "token": "MT",
            "min": 1,
            "max": 1000
        },
        {
            "token": "ETH",
            "min": 0.06,
            "max": 60
        },
        {
            "token": "BTC",
            "min": 0.001,
            "max": 1
        }
    ]

     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/config
     * @apiVersion 1.0.0
     */
    express.all('/config', async (req, res) => {
        res.json({
            success: true,
            result: express_config
        });
    });

    /**
     * @api {post} /express/get_price/:base_token_name/:quote_token_name/:base_amount 获取兑换价格
     * @apiDescription 根据币种和深度获取对应的兑换比例
     * @apiName get_price
     * @apiGroup express
     * @apiParam {string} base_token_name 兑出币种
     * @apiParam {string} quote_token_name 兑入币种
     * @apiParam {string} base_amount  兑换数量
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
			"success": true,
    		"result": "15.70000000",
    		"err": null
     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/get_price/ASIM/CNYC/1
     * @apiVersion 1.0.0
     */


    express.all('/get_price/:base_token_name/:quote_token_name/:base_amount', async (req, res) => {
        let { base_token_name, quote_token_name, base_amount } = req.params;
        let [err, price] = await to(get_price(base_token_name, quote_token_name, base_amount, order))
        res.json({
            success: price == undefined ? false : true,
            result: price,
            err: err
        });

    });


    /**
     * @api {post} /express/my_express_length/:address 获取记录长度
     * @apiDescription 获取兑换记录的条数
     * @apiName my_express_length
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
     "success": true,
    "result":
        {
            "success": true,
            "result": "0",
            "err": null
        },
    "err": null

     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/my_express_length/0x6665bc429f51bdb3b95dac156c1c4b396c0b695162
     * @apiVersion 1.0.0
     */

    express.all('/my_express_length/:address', async (req, res) => {
        let { address } = req.params;
        let [err, result] = await to(psql_db.my_express_length([address]))
        res.json({
            success: result == undefined ? false : true,
            result: result,
            err: err
        });

    });


    /**
     * @api {post} /express/get_pool_info 获取资产池情况
     * @apiDescription 获取当前闪兑资金池各币种储备量
     * @apiName get_pool_info
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
     "success": true,
    "result":
        {
            "token_symbol": "CNYC",
            "asim_asset_id": "000000000000000c00000000",
            "asim_asset_balance": 0,
            "icon": "https://www.mist.exchange/res/icons/CNYCa.png"
        },
    "err": null

     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/get_pool_info
     * @apiVersion 1.0.0
     */
    express.all('/get_pool_info', async (req, res) => {
        let token_arr = await mist_wallet.list_tokens();

        let balances = [];
        for (var i in token_arr) {
            let asset = new Asset(token_arr[i].asim_assetid)
            let [err4, assets_balance] = await to(asset.balanceOf(mist_config.express_address))
            if(err4)console.error(err4)
            let asset_balance = 0;
            for (let j in assets_balance) {
                if (token_arr[i].asim_assetid == assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            let icon = 'http://fingo-cdn.asimov.work/res/icons/' + token_arr[i].symbol + 'a.png'
            let balance_info = {
                token_symbol: token_arr[i].symbol,
                asim_asset_id: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance,
                icon: icon
            };

            balances.push(balance_info);
            console.log(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });

    });


    express.all('/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:sign_data', async (req, res) => {
        let { base_token_name, quote_token_name, amount, address, sign_data } = req.params;
        let [base_err, base_txid] = await to(chain.sendrawtransaction([sign_data]));
        let base_tx_status = base_txid == undefined ? "failed" : "successful";

        //失败的记录也入表

        // let base_token_price = await mist_wallet.get_token_price2pi(base_token_name);
        // let quote_token_price = await mist_wallet.get_token_price2pi(quote_token_name);

        //根据深度取价格
        let [err, price] = await to(get_price(base_token_name, quote_token_name, amount, order));
        if(err)console.error(err)

        let quote_amount = NP.times(amount, price, 0.995);
        let fee_amount = NP.times(amount, price, 0.005);

        let quote_tx_status, quote_err, quote_txid;
        if (!base_err) {
            let walletInst = await my_wallet(mist_config.express_word);
            let tokens = await psql_db.get_tokens([quote_token_name]);
            let asset = new Asset(tokens[0].asim_assetid);
            asset.unlock(walletInst, mist_config.wallet_default_passwd);
            await walletInst.queryAllBalance();
            [quote_err, quote_txid] = await to(asset.transfer(address, quote_amount));
            quote_tx_status = quote_txid == undefined ? "failed" : "successful";
        }


        let info = {
            trade_id: null,
            address: address,
            base_asset_name: base_token_name,
            base_amount: amount,
            price: price,
            quote_asset_name: quote_token_name,
            quote_amount: quote_amount,
            fee_rate: 0.005,
            fee_token: quote_token_name,
            fee_amount: fee_amount,
            base_txid: base_txid,
            base_tx_status: base_tx_status,
            quote_txid: quote_txid,
            quote_tx_status: quote_tx_status
        };
        info.trade_id = utils.get_hash(info);
        let info_arr = utils.arr_values(info);

        let [err3, result3] = await to(psql_db.insert_express(info_arr));
        if(err3)console.error( err3, result3)
        let success;
        if (base_tx_status == 'successful' && quote_tx_status == 'successful' && !err3) {
            success = true;
        } else {
            success = false;
        }
        res.json({
            success: success,
            trade_id: info.trade_id,
            base_err: base_err,
            quote_err: quote_err
        });
    });


    /**
     * @api {post} /express/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data 广播闪兑交易
     * @apiDescription 广播向官方地址的转账并获取目标币种的入账
     * @apiName build_express_v2
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
	 "success": true,
	 "trade_id": "3882ef7e018ed713963ae2495687276936c5e87be42f52aaee3537549e2176eb"
     *  }
     * @apiSampleRequest https://poa.mist.exchange/api/express/sendrawtransaction/build_express_v2/ETH/01000000052eaec5adabda0ad548dc425d6f15fe342f975d54eded038549634da938e0f426000000006b483045022100bcf4ddd36ef656bf91e355d665a006c8aa0ea2bbed7e1a1b45b66c17de03bb3502207fa89b658b672360504d4becc30afc3099718495d2a3b8a69825e27bb18d9f66012103b225a0756af3fbc2563b966bc900ef7858c0f0f6edc85f82d0ccca45c79a0590ffffffffedb1f3eea1b30a16988b3b750576a80cb3ed8b4cc741e779c73e6bd27b9c0ea1000000006a47304402207eb92260aa94d462c317ae1f5dc88d56dc1b5333bef10fdcc07205816e42e6dd0220700eaeb64526f2b310912cbf148d433b86bd1cce71159782eade1e24fd838287012103b225a0756af3fbc2563b966bc900ef7858c0f0f6edc85f82d0ccca45c79a0590ffffffff978d3189a845c9174ce5d1075cb7ba1ae3603a4048facecb160d911642f9679f020000006a47304402207356f954f8b45b2f6db0104a042abeebafae3a83b288c289b60a740ac5e10038022037e29b5e12c73386cbd6a91bb29faf979b335e45ec64eb160ca52403d59a40fd012103b225a0756af3fbc2563b966bc900ef7858c0f0f6edc85f82d0ccca45c79a0590ffffffffcf9fba221c9006a9ebc467a5b64b11722d50e0f909e5c0d4e5f70b2d8a162fe8010000006b48304502210097a6c0a03eac98a53c88717c7da10370a289c55ffea6cd014d991205ff48d9cd02204335530afc7830a0ee46547b1cb3ddc3817ce18a892adb11d82b7c19d759feeb012103b225a0756af3fbc2563b966bc900ef7858c0f0f6edc85f82d0ccca45c79a0590ffffffffbfa02ed068eab48da533d6a842374348d1b55e3d3a07d3868887f626bb24ea3b000000006a473044022040d60d81524e7dd5a55ec97bb7af6574638d3d823cf51edf972f5099f69c382a02206ad4a704fc5e190d912958713aa2c7e0150e07ca1b5e35d016bc88b90cd7762e012103b225a0756af3fbc2563b966bc900ef7858c0f0f6edc85f82d0ccca45c79a0590ffffffff03a0860100000000001a76a91566b7a9a597306b5fb16909b515c654f30a4c2eb74cc5ac0c000000000000000b00000001006463ba00000000001a76a9156602ca6e2820ec98cc68909fdd9f87c7bd23b62000c5ac0c000000000000000b000000010080b63908000000001a76a9156602ca6e2820ec98cc68909fdd9f87c7bd23b62000c5ac0c000000000000000000000000000852000000000000
     * @apiVersion 1.0.0
     */


    express.all('/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data', async (req, res) => {
        let { quote_token_name, sign_data } = req.params;
        let [base_err, base_txid] = await to(chain.sendrawtransaction([sign_data]));
        let trade_id;
        if (base_txid) {
            //只有decode成功才是成功
            let info = {
                trade_id: null,
                address: null,
                base_asset_name: null,
                base_amount: null,
                price: null,
                quote_asset_name: quote_token_name,
                quote_amount: null,
                fee_rate: 0.005,
                fee_token: quote_token_name,
                fee_amount: null,
                base_txid: base_txid,
                base_tx_status: 'pending',
                quote_txid: null,
                quote_tx_status: 'pending'
            };
            info.trade_id = utils.get_hash(info);
            trade_id = info.trade_id;
            let info_arr = utils.arr_values(info);

            let [err3, result3] = await to(psql_db.insert_express(info_arr));
            if(err3)console.error(err3, result3)
            res.json({
                success: true,
                trade_id: info.trade_id,
            });
        } else {
            res.json({
                success: false,
                err: base_err
            });

        }
        setTimeout(async () => {
            //失败的记录也入表
            let [decode_err, decode_info] = await to(utils.decode_transfer_info(base_txid));
            let { from, asset_id, vin_amount, to_amount, remain_amount } = decode_info;

            let base_tx_status;
            if (!decode_err) {
                base_tx_status = 'successful'
            } else {
                console.error(decode_err,from, asset_id, vin_amount, to_amount, remain_amount )
                base_tx_status = 'illegaled'
            }

            if (decode_info.to != mist_config.express_address) {
                base_tx_status = 'illegaled';
                console.error(`reciver ${decode_info.to}  is not official address`)
            }

            let [err3, base_token] = await to(psql_db.get_tokens([asset_id]));
            if (err3 || base_token.length == 0) {
                base_tx_status = 'illegaled';
                console.error(`asset ${asset_id}  is not support`)
            }

            let [err, price] = await to(get_price(base_token[0].symbol, quote_token_name, to_amount, order));
            if( err ) console.error(err)
            let current_time = utils.get_current_time();

            let quote_amount = NP.times(to_amount, price, 0.995);
            let fee_amount = NP.times(to_amount, price, 0.005);

            let info = {
                address: from,
                base_asset_name: base_token[0].symbol,
                base_amount: to_amount,
                price: price,
                quote_amount: quote_amount,
                fee_amount: fee_amount,
                base_tx_status: base_tx_status,
                quote_tx_status: "pending",
                updated_at: current_time,
                trade_id: trade_id
            };
            let info_arr = utils.arr_values(info);
            //  todo:deal error
            let [err4, result4] = await to(psql_db.update_base(info_arr));

            if( err4 ) console.error(err4,result4)

        }, 10000);

    });


    return express;
};
