import to from 'await-to-js';
import NP from '../common/NP';
import {Router} from 'express';

import {chain} from '../wallet/api/chain';

import {IPoolInfo, ITrade} from './interface'
import MistWallet from '../adex/api/mist_wallet';
import OrderAPI from '../adex/api/order';
import Utils from '../adex/api/utils';
import DBClient from './models/db';

import mist_config from '../cfg';
import mistConfig from '../cfg';
import Asset from '../wallet/contract/Asset';
import {errorCode} from '../error_code'


const express_config = [
    {
        token: 'CNYC',
        min: 60,
        max: 60000,
    },
    {
        token: 'USDT',
        min: 10,
        max: 10000,
    },
    {
        token: 'ASIM',
        min: 1,
        max: 1000,
    },
    {
        token: 'MT',
        min: 1,
        max: 1000,
    },
    {
        token: 'ETH',
        min: 0.06,
        max: 60,
    },
    {
        token: 'BTC',
        min: 0.001,
        max: 1,
    },
];

async function get_price(base_token_name :string, quote_token_name: string, amount: number, order: OrderAPI): Promise<string> {
    let base_value = 0;
    let base_amount = 0;
    if (base_token_name !== 'CNYC') {
        const [base_book_err, base_book] = await to(order.order_book(base_token_name + '-CNYC', `${2}`));
        if (base_book_err || !base_book || !base_book.bids) {
            console.error('[ADEX EXPRESS]::(base_book):', base_book_err, base_book);
            throw new Error(base_book_err);
        }
        const base_bids = base_book.bids;
        // 模拟先卖掉所有base，再全部买quote
        for (const index in base_bids) {
            if (!base_bids[index]) continue;
            const tmp_amount = base_amount;
            base_amount = NP.plus(base_amount,+base_bids[index][1]);
            if (base_amount >= amount) {
                base_value += NP.times(amount - tmp_amount, base_bids[index][0]);
                break;
            } else {
                base_value += NP.times(base_bids[index][1], base_bids[index][0]);
            }
        }
    } else {
        base_value = NP.times(amount, 1);
    }

    let quote_value = 0;
    let quote_amount = 0;
    if (quote_token_name !== 'CNYC') {
        const [quote_book_err, quote_book] = await to(order.order_book(quote_token_name + '-CNYC', '2'));
        if (quote_book_err || !quote_book || !quote_book.asks) {
            console.error('[ADEX EXPRESS]::(quote_book):', quote_book_err, quote_book);
            throw new Error(quote_book_err);
        }
        const quote_asks = quote_book.asks.reverse();

        for (const index in quote_asks) {
            if (!quote_asks[index]) continue;
            const tmp_value = quote_value;
            quote_value += NP.times(quote_asks[index][1], quote_asks[index][0]);

            if (quote_value >= base_value) {
                quote_amount += NP.divide(base_value - tmp_value, quote_asks[index][0]);
                break;
            } else {
                // amount * price
                quote_amount += +quote_asks[index][1];
            }
        }
    } else {
        quote_amount = NP.divide(base_value, 1);
    }
    const price = NP.divide(quote_amount, amount).toFixed(8);
    return price;
}

export default () => {
    const express = Router();
    const psql_db = new DBClient();
    const mist_wallet = new MistWallet(psql_db);
    const utils = new Utils();
    const order = new OrderAPI(psql_db);

    /**
     * @api {post} /express/my_records/:page/:perpage my_records(Obsolete)
     * @apiDescription my_records
     * @apiName my_records
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "trade_id": "c743c6fc5a7484ca8d27b3ab0c36a8272b6e93ab1c1c44d05c24d48516789e9f",
                "address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
                "base_asset_name": "BTC",
                "base_amount": 0.001,
                "price": 57.09264327,
                "quote_asset_name": "ETH",
                "quote_amount": 0.05680718,
                "fee_rate": 0.005,
                "fee_token": "ETH",
                "fee_amount": 0.00028546,
                "base_txid": "76830e5e5c4239156e4d4cd8e211809b4a76351cfe0c86a17374582358ee6f3a",
                "base_tx_status": "successful",
                "quote_txid": "4e33b16f25a707d1191307ae7bbd204851880d67040333f4bf244d43e1bc777f",
                "quote_tx_status": "successful",
                "updated_at": "2020-01-02T08:24:47.747Z",
                "created_at": "2020-01-02T08:24:33.537Z",
                "base_token_icon": "http://fingo-cdn.asimov.work/res/icons/BTCa.png",
                "quote_token_icon": "http://fingo-cdn.asimov.work/res/icons/ETHa.png"
            }
        ],
        "err": null
     }
     *  }
     * @apiSampleRequest http://119.23.181.166:21000/express/my_records/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/3
     * @apiVersion 1.0.0
     */
    express.all('/my_records/:address/:page/:perpage', async (req, res) => {
        const {address, page, perpage} = req.params;
        const [start, end] = ['2019-01-01 00:00:00.000','2031-01-01 00:00:00.000'];
        const offset = (+page - 1) * +perpage;
        const [err, records] = await to(
            psql_db.my_express([address, offset, perpage,start,end])
        );
        if (records) {
            for (const record of records as ITrade[]) {
                record.base_token_icon =
                    mist_config.icon_url +
                    record.base_asset_name +
                    'a.png';
                record.quote_token_icon =
                    mist_config.icon_url +
                    record.quote_asset_name +
                    'a.png';
            }
        }
        res.json({
            success: !records ? false : true,
            result: records,
            err,
        });
    });


    /**
     * @api {post} /express/my_records_v2 my_records_v2
     * @apiDescription my_records
     * @apiName my_records_v2
     * @apiGroup express
     * @apiParam {string} address    user's address
     * @apiParam {string} page                  page
     * @apiParam {string} perpage               perpage
     * @apiParam {Number} start                  unix time
     * @apiParam {Number} end                    unix time
     * @apiParam {Boolean} need_total_length      To calculate paging usage, This is a time-consuming option，you should only request once
     * @apiParamExample {json} Request-Example:
     {
         "address":"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
         "page":"1",
         "perpage":"1",
         "start":0,
         "end":1576424202000,
         "need_total_length":true
     }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": {
            "records": [
                {
                    "trade_id": "d053a8824c4d13538dec9c65b24e7ce7acc21c33f123fd59ce0b8f98569114ee",
                    "address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
                    "base_asset_name": "ETH",
                    "base_amount": 1,
                    "price": 0.02025192,
                    "quote_asset_name": "BTC",
                    "quote_amount": 0.02015066,
                    "fee_rate": 0.005,
                    "fee_token": "BTC",
                    "fee_amount": 0.00010126,
                    "base_txid": "23bf09bdbb2e31c7f83e049da051679290b0daed860802679ee5b7ef4f8a9f21",
                    "base_tx_status": "successful",
                    "quote_txid": "3f48568de8a4ebef55f34a774c2629f050113fa128da73ae7c1da8c64af8628b",
                    "quote_tx_status": "successful",
                    "updated_at": "2019-12-03T08:41:27.448Z",
                    "created_at": "2019-12-03T08:41:27.448Z",
                    "base_token_icon": "http://fingo-cdn.asimov.work/res/icons/ETHa.png",
                    "quote_token_icon": "http://fingo-cdn.asimov.work/res/icons/BTCa.png"
                }
            ],
            "totalLength": "3"
        },
        "err": null
     }
     * @apiSampleRequest http://119.23.181.166:21000/express/my_records_v2
     * @apiVersion 1.0.0
     */

    express.all('/my_records_v2', async (req, res) => {
        const {address, page, perpage,start,end,need_total_length} = req.body;
        let [totalLengthErr,totalLength] = [null,null];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const offset = (+page - 1) * +perpage;
        const filter = [address, offset, perpage,startDate,endDate];
        const [recordsErr, records] = await to(psql_db.my_express(filter));
        if (records) {
            for (const record of records as any[]) {
                record.base_token_icon =
                    mist_config.icon_url +
                    record.base_asset_name +
                    'a.png';
                record.quote_token_icon =
                    mist_config.icon_url +
                    record.quote_asset_name +
                    'a.png';
            }
        }
        if(need_total_length === true){
            [totalLengthErr,totalLength] = await to(psql_db.my_express_length_v2([address,startDate,endDate]));
        }
        const result = {records, totalLength};
        res.json({
            success: (!records && totalLengthErr) ? false : true,
            errorCode: (!records && totalLengthErr) ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            result,
            err: recordsErr,
        });
    });

    /**
     * @api {post} /express/get_express_trade/:trade_id get_express_trade
     * @apiDescription Get order info
     * @apiName get_express_trade
     * @apiGroup express
     * @apiParam {string} trade_id express trade ID
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": {
            "trade_id": "f091fdef406d21f51befb99f35df67a86d0be4daf85305dab0ad78747fbbac46",
            "address": "0x66037f1be64bdd9634f81833e90235edfe4480a80e",
            "base_asset_name": "USDT",
            "base_amount": 1,
            "price": 0.53937548,
            "quote_asset_name": "ASIM",
            "quote_amount": 0.5366786,
            "fee_rate": 0.005,
            "fee_token": "ASIM",
            "fee_amount": 0.00269688,
            "base_txid": "b2aec748bcb733d62fdebc48315aef072f220bb4c90d222627d3c56c5961ef0e",
            "base_tx_status": "successful",
            "quote_txid": "135c7b971ed5432940e088d63a6b39de85074bc5c84fa995e49f3b0430d583bc",
            "quote_tx_status": "successful",
            "updated_at": "2020-03-04T03:29:21.342Z",
            "created_at": "2020-03-04T03:29:08.685Z",
            "base_token_icon": "http://fingo-cdn.asimov.work/res/icons/USDTa.png",
            "quote_token_icon": "http://fingo-cdn.asimov.work/res/icons/ASIMa.png"
        },
        "err": null
     }
     *  }
     * @apiSampleRequest http://119.23.181.166:21000/express/get_express_trade/4e6b881de2eb3b9e8bdb4baefac9d5182c54eb274c821ca43e04301c9a7e2497
     * @apiVersion 1.0.0
     */

    express.all('/get_express_trade/:trade_id', async (req, res) => {
        const {trade_id} = req.params;
        const [err, record] = await to(psql_db.find_express([trade_id]));
        if (err || !record) {
            return res.json({
                success: false,
                errorCode: errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                err,
            });
        }

        if (record && record.length === 0) {
            return res.json({
                success: true,
                result: [],
            });
        }

        if (record[0].base_asset_name && record[0].quote_asset_name) {
            record[0].base_token_icon =
                mist_config.icon_url +
                record[0].base_asset_name +
                'a.png';
            record[0].quote_token_icon =
                mist_config.icon_url +
                record[0].quote_asset_name +
                'a.png';
        } else {
            record[0].base_token_icon = null;
            record[0].quote_token_icon = null;
        }
        res.json({
            success: true,
            result: record[0],
            err,
        });
    });

    /**
     * @api {post} /express/config  config
     * @apiDescription fee config of express
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
     * @apiSampleRequest http://119.23.181.166:21000/express/config
     * @apiVersion 1.0.0
     */
    express.all('/config', async (req, res) => {
        res.json({
            success: true,
            result: express_config,
        });
    });

    /**
     * @api {post} /express/get_price/:base_token_name/:quote_token_name/:base_amount get_price
     * @apiDescription The corresponding conversion ratio is obtained according to currency and depth
     * @apiName get_price
     * @apiGroup express
     * @apiParam {string} base_token_name Coin you are going to pay
     * @apiParam {string} quote_token_name Coin you want to change
     * @apiParam {string} base_amount  amount of base token
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
			"success": true,
    		"result": "15.70000000",
    		"err": null
     *  }
     * @apiSampleRequest http://119.23.181.166:21000/express/get_price/ASIM/CNYC/1
     * @apiVersion 1.0.0
     */

    express.all(
        '/get_price/:base_token_name/:quote_token_name/:base_amount',
        async (req, res) => {
            const {base_token_name, quote_token_name, base_amount} = req.params;
            const [err, price] = await to(
                get_price(base_token_name, quote_token_name, Number(base_amount), order)
            );
            res.json({
                success: !price ? false : true,
                errorCode: !price ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
                result: price,
                err,
            });
        }
    );

    /**
     * @api {post} /express/my_express_length/:address my_express_length
     * @apiDescription Gets the number in the express record
     * @apiName my_express_length
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": "0",
        "err": null
     }
     * @apiSampleRequest http://119.23.181.166:21000/express/my_express_length/0x6665bc429f51bdb3b95dac156c1c4b396c0b695162
     * @apiVersion 1.0.0
     */

    express.all('/my_express_length/:address', async (req, res) => {
        const {address} = req.params;
        const [err, result] = await to(psql_db.my_express_length([address]));
        res.json({
            success: !result ? false : true,
            errorCode: !result ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
            result,
            err,
        });
    });

    /**
     * @api {post} /express/get_pool_info get_pool_info
     * @apiDescription Access to the current flash pool of currency reserves
     * @apiName get_pool_info
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
     "success": true,
        "result":[
            {
                "token_symbol": "CNYC",
                "asim_asset_id": "000000000000000c00000000",
                "asim_asset_balance": 0,
                "icon": "https://www.mist.exchange/res/icons/CNYCa.png"
            },
        ],
        "err": null
     }
     * @apiSampleRequest http://119.23.181.166:21000/express/get_pool_info
     * @apiVersion 1.0.0
     */
    express.all('/get_pool_info', async (req, res) => {
        const token_arr = await mist_wallet.list_mist_tokens();

        const balances: IPoolInfo[] = [];
        const asset = new Asset(mistConfig.asimov_master_rpc);
        const [assets_balance_err, assets_balance_result] = await to(
            asset.balanceOf(mist_config.express_address)
        );

        if (assets_balance_err || !assets_balance_result || assets_balance_result[0].assets === undefined) {
            console.error('[ADEX EXPRESS]::(balanceOf):', assets_balance_err, assets_balance_result);
            return res.json({
                success: false,
                errorCode: errorCode.EXTERNAL_DEPENDENCIES_ERROR ,
                err: assets_balance_err,
            });
        }
        const assets_balance = assets_balance_result[0].assets;

        for (const i in token_arr as any[]) {
            if (!token_arr[i]) continue;

            let asset_balance = 0;
            for (const j in assets_balance) {
                if (token_arr[i].asim_assetid === assets_balance[j].asset) {
                    asset_balance = assets_balance[j].value;
                }
            }
            const icon =
                mist_config.icon_url +
                token_arr[i].symbol +
                'a.png';
            const balance_info = {
                token_symbol: token_arr[i].symbol,
                asim_asset_id: token_arr[i].asim_assetid,
                asim_asset_balance: asset_balance / (1 * 10 ** 8),
                icon,
            };

            balances.push(balance_info);
            console.log(balance_info);
        }
        res.json({
            success: true,
            result: balances,
        });
    });

    /**
     * @api {post} /express/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data build_express_v2
     * @apiDescription Broadcast the transfer to the official address and start the exchange
     * @apiName build_express_v2
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
	 "success": true,
	 "trade_id": "3882ef7e018ed713963ae2495687276936c5e87be42f52aaee3537549e2176eb"
     *  }
     * @apiSampleRequest http://119.23.181.166:21000/express/sendrawtransaction/build_express_v2/ETH/xxx
     * @apiVersion 1.0.0
     */

    express.all(
        '/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data',
        async (req, res) => {
            // tslint:disable-next-line:prefer-const
            let {quote_token_name: quote_asset_name, sign_data} = req.params;
            const [base_err, base_txid] = await to(
                chain.sendrawtransaction([sign_data])
            );
            let trade_id;
            if (base_txid) {
                // 只有decode成功才是成功
                const info = {
                    trade_id: null,
                    address: null,
                    base_asset_name: null,
                    base_amount: null,
                    price: null,
                    quote_asset_name,
                    quote_amount: null,
                    fee_rate: 0.005,
                    fee_token: quote_asset_name,
                    fee_amount: null,
                    base_txid,
                    base_tx_status: 'pending',
                    quote_txid: null,
                    quote_tx_status: 'pending',
                };
                info.trade_id = utils.get_hash(info);
                trade_id = info.trade_id;
                const info_arr = utils.arr_values(info);

                const [insertExpressErr, insertExpressRes] = await to(psql_db.insert_express(info_arr));
                if (insertExpressErr || !insertExpressRes) console.error('[ADEX EXPRESS]::(insert_express):', insertExpressErr, insertExpressRes);
                res.json({
                    success: insertExpressRes ? true : false,
                    errorCode: insertExpressRes ? errorCode.SUCCESSFUL : errorCode.EXTERNAL_DEPENDENCIES_ERROR ,
                    trade_id: !insertExpressRes ? null : info.trade_id,
                });
            }
            res.json({
                success: false,
                errorCode: errorCode.EXTERNAL_DEPENDENCIES_ERROR ,
                err: base_err,
            });

        }
    );

    /**
     * @api {post} /express/check_trade/:quote_token/:quote_amount check_trade
     * @apiDescription Check whether the pool reserves allow the conversion
     * @apiName check_trade
     * @apiGroup express
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": false,
        "err": "Express capital pool balance is insufficient, temporarily cannot exchange large amount"
     }
     * @apiSampleRequest http://119.23.181.166:21000/express/check_trade/BTC/1000000
     * @apiVersion 1.0.0
     */

    express.all('/check_trade/:quote_token/:quote_amount', async (req, res) => {
        const {quote_token, quote_amount} = req.params;
        const asset = new Asset(mist_config.asimov_master_rpc);
        let [success, result, err] = [null, null, null];
        // @ts-ignore
        // tslint:disable-next-line:no-shadowed-variable
        let code = errorCode.SUCCESSFUL;
        const [balancesErr, balances] = await to(asset.get_asset_balances(mist_wallet, mist_config.express_address, quote_token));
        if (!balances || !balances[0]) {
            success = false;
            err = balancesErr;
            code = errorCode.EXTERNAL_DEPENDENCIES_ERROR;
        } else if (+quote_amount > balances[0].asim_asset_balance / 2) {
            success = true;
            result = false;
            err = `Express capital pool balance is insufficient, temporarily cannot exchange large amount`
        } else {
            success = true;
            result = true;
        }
        res.json({
            success,
            errorCode:code,
            result,
            err
        });
    });

    return express;
};

export {get_price};
