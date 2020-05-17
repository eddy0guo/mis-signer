import {Router} from 'express';
import to from 'await-to-js';
import NP from '../common/NP';
import {AsimovConst, AsimovWallet} from '@fingo/asimov-wallet';
import * as cryptoSha256 from 'crypto';

import {chain} from './api/chain';

import {CoinAssetFeeConfig, ListFingoConfig} from './interfacce'
import mist_config from '../cfg';
import adex_utils from '../adex/api/utils';
import psql from '../adex/models/db';
import Asset from './contract/Asset';
import MistWallet from '../adex/api/mist_wallet';
import Token from './contract/Token';
import {errorCode} from '../error_code'


const Coin2AssetFee: CoinAssetFeeConfig [] = [
    {
        token: 'CNYC',
        amount: 10,
    },
    {
        token: 'USDT',
        amount: 1.5,
    },
    {
        token: 'ASIM',
        amount: 0.6,
    },
    {
        token: 'MT',
        amount: 0.2,
    },
    {
        token: 'ETH',
        amount: 0.01,
    },
    {
        token: 'BTC',
        amount: 0.0002,
    },
];

export default () => {
    const wallet = Router();

    const psql_db = new psql();
    const utils = new adex_utils();
    const mist_wallet = new MistWallet(psql_db);

    /**
     * @api {post} /wallet/sendrawtransaction/asset2coin_v3/:sign_data asset2coin_v3
     * @apiDescription The assets of broadcast currency are delimited and the assets of custody are delimited
     * @apiName asset2coin_v3
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589339554976,
        "data": "4ae713eb4622148f41a687040f203c3455738c46f1d6850a2bf7f215e226b175"
    }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/sendrawtransaction/asset2coin_v3/
     * @apiVersion 1.0.0
     */

    // 划转操作？
    // 是的，asset转erc20
    // 只有广播失败的不会存表，其他会存
    wallet.all(
        '/sendrawtransaction/asset2coin_v3/:sign_data',
        async (req, res) => {
            const sign_data = [req.params.sign_data];
            const [master_err, master_txid] = await to(
                chain.sendrawtransaction(sign_data)
            );

            if (!master_err) {
                const info = {
                    id: null,
                    address: null,
                    token_name: null,
                    amount: null,
                    side: 'asset2coin',
                    master_txid,
                    master_txid_status: 'pending',
                    child_txid: null,
                    child_txid_status: 'pending',
                    fee_asset: null,
                    fee_amount: null,
                };
                info.id = utils.get_hash(info);
                const info_arr = utils.arr_values(info);
                const [err3, result3] = await to(psql_db.insert_bridge(info_arr));
                if (err3 || !result3) {
                    console.log('[MIST SIGNER]::(psql_db.insert_bridge):', err3, result3);
                    res.json({
                        code:errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                        errorMsg:err3,
                        timeStamp:Date.now(),
                        data:null,
                    });
                }

                return res.json({
                    code:errorCode.SUCCESSFUL,
                    errorMsg:null,
                    timeStamp:Date.now(),
                    data:info.id,
                });
            }

            res.json({
                code:errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                errorMsg:master_err.message,
                timeStamp:Date.now(),
                data:null,
            });
        }
    );
    /**
     * @api {post} /wallet/sendrawtransaction/coin2asset_v4/ coin2asset_v4
     * @apiDescription The assets of broadcast currency are delimited and the assets of custody are delimited
     * @apiName coin2asset_v4
     * @apiGroup wallet
     * @apiParam {string} signature signature info
     * @apiParam {string} publicKey publicKey info
     * @apiParam {string} address Collection address
     * @apiParam {string} token_name  coin of bridge
     * @apiParam {string} amount  amount of bridge
     * @apiParam {string} expire_time  expire_time of signature
     @apiParamExample {json} Request-Example:
     {
         "signature":"0x80635e66cd8bdbd85a9083e1aa948a19c3b1eaa6e17375bac4075d1239eff87d1efc085da5419022c51d76415a60f3f84b8179d3c013e0e9dad7ca83122625f21c",
         "publicKey": "038fd51dc067031e66c042075199033435493cc9d049ca3108f78e0cd5016a1711",
         "address":"0x66c16d217ce654c5ebbdcb1f978ef2dee7ec444ada",
         "token_name":"CNYC",
         "amount":5678,
         "expire_time":1586316572140
       }
     *
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 200003,
        "errorMsg": "sign data expire",
        "timeStamp": 1589339614779,
        "data": null
    }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/sendrawtransaction/coin2asset_v4
     * @apiVersion 1.0.0
     */

    wallet.all('/sendrawtransaction/coin2asset_v4', async (req, res) => {
        const {signature, address, token_name, amount, expire_time,publicKey} = req.body;

        const asset = new Asset(mist_config.asimov_master_rpc);
        const [balancesErr, balances] = await to(asset.get_asset_balances(mist_wallet, mist_config.bridge_address, token_name));
        if (amount > balances[0].asim_asset_balance) {
            console.error(`bridge account  only have ${balances[0].asim_asset_balance} ${token_name}`);
            return res.json({
                code:errorCode.OFFICIAL_RESOURCES_INSUFFICIENT,
                errorMsg:'The official account have no enough balance',
                timeStamp:Date.now(),
                data:null,
            });
        }

        const current_time = new Date().getTime();
        if (+current_time > expire_time) {
            return res.json({
                code:errorCode.SIGNATURE_EXPIRED,
                errorMsg:'sign data expire',
                timeStamp:Date.now(),
                data:null,
            });
        }

        const tokens = await psql_db.get_tokens([token_name]);

        const info = [
            'MIST_BURN',
            tokens[0].address,
            mist_config.bridge_address,
            amount,
            expire_time,
        ];
        const str = info.join('');
        const root_hash = cryptoSha256.createHmac('sha256', '123');
        const hash = root_hash.update(str, 'utf8').digest('hex');
        const [verifyErr,verifyRes] = await to(utils.verify2(address,hash, signature,publicKey));
        if (!verifyRes) {
            return res.json({
                code:errorCode.VERIFY_FAILED,
                errorMsg:'verify failed' + verifyErr,
                timeStamp:Date.now(),
                data:null,
            });
        }
        let fee_amount = 0;
        for (const fee of Coin2AssetFee) {
            if (token_name === fee.token) {
                fee_amount = fee.amount;
                if (amount <= fee_amount) {
                    return res.json({
                        code:errorCode.FEE_INSUFFICIENT,
                        errorMsg:'fee is not enough',
                        timeStamp:Date.now(),
                        data:null,
                    });
                }
            }
        }

        const insert_info = {
            id: null,
            address,
            token_name: tokens[0].symbol,
            amount: NP.minus(amount, fee_amount),
            side: 'coin2asset',
            master_txid: null,
            master_txid_status: 'pending',
            child_txid: null,
            child_txid_status: 'pending',
            fee_asset: tokens[0].symbol,
            fee_amount,
        };

        insert_info.id = utils.get_hash(insert_info);
        const info_arr = utils.arr_values(insert_info);
        const [err3, result3] = await to(psql_db.insert_bridge(info_arr));

        if (err3) console.log(err3);

        return res.json({
            code:!result3 ? errorCode.EXTERNAL_DEPENDENCIES_ERROR:errorCode.SUCCESSFUL,
            errorMsg:err3,
            timeStamp:Date.now(),
            data:!result3 ? null:insert_info.id,
        });
    });

    wallet.all(
        '/burn_coin_tohex/:address/:token_name/:amount',
        async (req, res) => {
            const {address, token_name, amount} = req.params;
            const expire_time = 600;
            const tokens = await psql_db.get_tokens([token_name]);
            const token = new Token(tokens[0].address);
            const [balanceErr, balanceRes] = await to(token.balanceOf(address,'child_poa'));
            const available_amount = NP.divide(balanceRes, 100000000);
            if (available_amount < Number(amount)) {
                return res.json({
                    code:errorCode.BALANCE_INSUFFICIENT,
                    errorMsg:`Lack of balance,you have ${available_amount} ${token_name} but want spend ${amount}`,
                    timeStamp:Date.now(),
                    data:null,
                });
            }

            if (expire_time <= 0 || expire_time > 3600) {
                return res.json({
                    code:errorCode.SIGNATURE_EXPIRED,
                    errorMsg:'the expire_time must be less than 1 hour and more than 0',
                    timeStamp:Date.now(),
                    data:null
                });
            }

            const expire_at = new Date().getTime() + expire_time * 1000;
            const info = [
                'MIST_BURN',
                tokens[0].address,
                mist_config.bridge_address,
                amount,
                expire_at,
            ];

            const str = info.join('');
            const root_hash = cryptoSha256.createHmac('sha256', '123');
            const hash = root_hash.update(str, 'utf8').digest('hex');

            res.json({
                code:errorCode.SUCCESSFUL,
                errorMsg:null,
                timeStamp:Date.now(),
                data:{
                    hash,
                    expire_at
                }
            });
        }
    );

    /**
     * @api {post} /wallet/find_convert/:id find_convert
     * @apiDescription Details of the bridge order
     * @apiName find_convert
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589339642684,
        "data": {
            "id": "8c4ddabebe95718a37aea074120d3bd133196c01812935ddef42dffcdfd431ac",
            "address": "0x6602ca6e2820ec98cc68909fdd9f87c7bd23b62000",
            "token_name": "ETH",
            "amount": 1,
            "side": "asset2coin",
            "master_txid": "225a905c4e7fe2579f0217b49af2496f57424e512eacf2718ef2348a28cabb68",
            "master_txid_status": "successful",
            "child_txid": "dc5bf2c1208a832d898bff32e7118f0d558b8c66e26c4bb1e729f3caeebffffe",
            "child_txid_status": "successful",
            "fee_asset": "ASIM",
            "fee_amount": "0.00105252",
            "updated_at": "2019-12-18T10:06:45.317Z",
            "created_at": "2019-12-18T10:06:34.273Z"
        }
    }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/find_convert/8c4ddabebe95718a37aea074120d3bd133196c01812935ddef42dffcdfd431ac
     * @apiVersion 1.0.0
     */

    wallet.all('/find_convert/:id', async (req, res) => {
        const [err, convert] = await to(psql_db.find_bridge([req.params.id]));
        if (err) {
            return res.json({
                code:errorCode.EXTERNAL_DEPENDENCIES_ERROR,
                errorMsg:err,
                timeStamp:Date.now(),
                data:null
            });
        } else if (convert && convert.length === 0) {
            return res.json({
                code:errorCode.SUCCESSFUL,
                errorMsg:null,
                timeStamp:Date.now(),
                data:[]
            });
        } else {
            return res.json({
                code:errorCode.SUCCESSFUL,
                errorMsg:null,
                timeStamp:Date.now(),
                data:convert[0]
            });
        }
    });
    /**
     * @api {post} /express/my_converts_v4 my_converts_v4
     * @apiDescription my bridge records
     * @apiName my_converts_v4
     * @apiGroup wallet
     * @apiParam {string} address    user's address
     * @apiParam {string} token                  token symbol,Set to "" if you want to get all token
     * @apiParam {string} page                  page
     * @apiParam {string} perpage               perpage
     * @apiParam {Number} start                  unix time,
     * @apiParam {Number} end                    unix time
     * @apiParam {Boolean} need_total_length     To calculate paging usage, This is a time-consuming option，you should only request once
     * @apiParamExample {json} Request-Example:
     {
         "address":"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
         "token":"ETH",
         "page":"1",
         "perpage":"1",
         "start":0,
         "end":1576424202000,
         "need_total_length":true
     }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": 0,
        "timeStamp": 1589339743197,
        "data": {
            "records": [
                {
                    "id": "0fe6c194f4c41baed995661860910cc59bbbe546faf62a8b93a069d4e487a5a1",
                    "address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
                    "token_name": "ETH",
                    "amount": 0.08,
                    "side": "coin2asset",
                    "master_txid": "c6306254471689eef6f33d6c1dbe6f388213fa87636252ac8c2231528b29d244",
                    "master_txid_status": "successful",
                    "child_txid": "02605b81b930666dc1bac188e79a4763fccd4e738e7da2684d33352b3658194f",
                    "child_txid_status": "successful",
                    "fee_asset": "ASIM",
                    "fee_amount": "0.02",
                    "updated_at": "2019-12-13T08:35:01.250Z",
                    "created_at": "2019-12-13T08:34:59.185Z"
                }
            ],
            "totalLength": "2"
        }
    }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/my_converts_v4
     * @apiVersion 1.0.0
     */

    wallet.all(
        '/my_converts_v4', async (req, res) => {
            const {address, token, page, perpage, start, end, need_total_length} = req.body;
            let [totalLengthErr, totalLength] = [null, null];
            const startDate = new Date(start);
            const endDate = new Date(end);

            const offset = (+page - 1) * +perpage;
            const [err, records] = await to(
                psql_db.my_bridge_v4([address, offset, perpage, startDate, endDate, token])
            );
            if (need_total_length === true) {
                [totalLengthErr, totalLength] = await to(psql_db.my_bridge_length_v2([address, startDate, endDate, token]));
            }
            const result = {records, totalLength};
            res.json({
                code:(err || totalLengthErr) ? errorCode.EXTERNAL_DEPENDENCIES_ERROR : errorCode.SUCCESSFUL,
                errorMsg:err,
                timeStamp:Date.now(),
                data:(err || totalLengthErr) ? null:result
            });
        }
    );

    /**
     * @api {post} /wallet/Coin2AssetFee_config Coin2AssetFee_config
     * @apiDescription Get the Coin2Asset  fee information
     * @apiName Coin2AssetFee_config
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589339389504,
        "data": [
            {
                "token": "CNYC",
                "amount": 10
            },
            {
                "token": "USDT",
                "amount": 1.5
            },
            {
                "token": "ASIM",
                "amount": 0.6
            },
            {
                "token": "MT",
                "amount": 0.2
            },
            {
                "token": "ETH",
                "amount": 0.01
            },
            {
                "token": "BTC",
                "amount": 0.0002
            }
        ]
    }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/coin2asset_fee_config
     * @apiVersion 1.0.0
     */

    wallet.all('/coin2asset_fee_config', async (req, res) => {
        res.json({
            code:errorCode.SUCCESSFUL,
            errorMsg:null,
            timeStamp:Date.now(),
            data:Coin2AssetFee
        });
    });

    wallet.all('/sendrawtransaction/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [err, result] = await to(chain.sendrawtransaction(sign_data));
        res.json({result, err});
    });
    /**
     * @api {post} /wallet/list_fingo_config list_fingo_config
     * @apiDescription Gets the configuration for fingo
     * @apiName list_fingo_config
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "code": 0,
        "errorMsg": null,
        "timeStamp": 1589339686736,
        "data": {
            "dex_address": "0x630122b8d818203e407eaf9ba59668934b73198f4c",
            "express_address": "0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c",
            "asimov_chain_rpc": "https://rpc.fin.fingo.dev",
            "asimov_child_rpc": "https://rpc.mt.fingo.dev",
            "bridge_address": "0x66a5e2e1d9243f9dfd1d54b31952d94043a105188f"
        }
    }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/list_fingo_config
     * @apiVersion 1.0.0
     */

    wallet.all('/list_fingo_config', async (req, res) => {
        const conf: ListFingoConfig = {
            dex_address: mist_config.ex_address,
            express_address: mist_config.express_address,
            asimov_chain_rpc: mist_config.asimov_chain_rpc,
            asimov_child_rpc: mist_config.asimov_child_rpc,
            bridge_address: mist_config.bridge_address,
        };

        res.json({
            code:errorCode.SUCCESSFUL,
            errorMsg:null,
            timeStamp:Date.now(),
            data:conf
        });
    });


    wallet.all('/erc20_faucet/:address', async (req, res) => {
        if(process.env.MIST_MODE !== 'k8s') {
            const token_arr = await mist_wallet.list_mist_tokens();
            // tslint:disable-next-line:forin
            let j: number = 0;
            // tslint:disable-next-line:forin
            // @ts-ignore
            // tslint:disable-next-line:forin
            for (const i: number in token_arr) {
                // @ts-ignore
                setTimeout(async () => {

                    // tslint:disable-next-line:no-shadowed-variable
                    const wallet = new AsimovWallet({
                        name: 'test',
                        rpc: mist_config.asimov_child_rpc,
                        mnemonic: mist_config.bridge_word,
                    });
                    const to_amount = 1000000;

                    const [child_err, child_txid] = await to(wallet.contractCall.call(
                        token_arr[i].address,
                        'mint(address,uint256)',
                        [req.params.address, NP.times(to_amount, 100000000)],
                        AsimovConst.DEFAULT_GAS_LIMIT, 0,
                        AsimovConst.DEFAULT_ASSET_ID,
                        AsimovConst.DEFAULT_FEE_AMOUNT,
                        AsimovConst.DEFAULT_ASSET_ID,
                        AsimovConst.CONTRACT_TYPE.CALL));
                    // tslint:disable-next-line:no-unused-expression
                    console.log('mint %o err=%o,result=%o', token_arr[i].symbol, child_err, child_txid, '\n\n\n\n');
                    // 由于本地钱包根据划转来进行同步链上余额，后门也要伪造一条划转记录
                    const insert_info = {
                        id: null,
                        address:req.params.address,
                        token_name: token_arr[i].symbol,
                        amount:1000000,
                        side: 'asset2coin',
                        master_txid: 'fake',
                        master_txid_status: 'successful',
                        child_txid,
                        child_txid_status: 'successful',
                        fee_asset: token_arr[i].symbol,
                        fee_amount: 1,
                    };

                    insert_info.id = utils.get_hash(insert_info);
                    const info_arr = utils.arr_values(insert_info);
                    const [err3, result3] = await to(psql_db.insert_bridge(info_arr));
                    console.log('insert_bridge ',err3,result3);
                }, ++j * 10000);
            }
        }
        res.json({result: '', err: ''});
    });

    return wallet;
};
