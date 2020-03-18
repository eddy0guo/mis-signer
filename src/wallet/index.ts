import {Router} from 'express';
import to from 'await-to-js';
import NP from '../common/NP';
import {AsimovWallet, AsimovConst} from '@fingo/asimov-wallet';
import * as cryptoSha256 from 'crypto';

import {chain} from './api/chain';

import mist_config from '../cfg';
import adex_utils from '../adex/api/utils';
import psql from '../adex/models/db';
import Asset from './contract/Asset';
import MistWallet from '../adex/api/mist_wallet';


const Coin2AssetFee = [
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
          "success": true,
          "id": "eac9fee0a83dd7ebc2ba67012b14175f2fddf3eabbcfe435cb11f105101af46d"
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
                    res.json({success: false, err: err3});
                }

                return res.json({success: true, id: info.id});
            }

            res.json({success: false, err: master_err});
        }
    );

    /**
     * @api {post} /wallet/sendrawtransaction/coin2asset_v3/ coin2asset_v3
     * @apiDescription The assets of broadcast currency are delimited and the assets of custody are delimited
     * @apiName coin2asset_v3
     * @apiGroup wallet
     * @apiParam {json} signature signature info
     * @apiParam {string} address Collection address
     * @apiParam {string} token_name  coin of bridge
     * @apiParam {string} amount  amount of bridge
     * @apiParam {string} expire_time  expire_time of signature
     @apiParamExample {json} Request-Example:
     {"signature":
      {
              "r": "9ab18bf2783b6586391ea190c2b31ef060347dd085071f849e5c8909aa09f201",
              "s": "8732b9921e50ea6de592dcfa6c90c3214b6424aecf3388a7d1064828a0307ca",
              "pubkey": "02078e749afa7a3e869f8b2889aedd637adae74134165810f03e72e98a0564c0de"
          },
       "address":"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
       "token_name":"ETH",
       "amount":"0.08",
       "expire_time":"1577755470236"
    }
     *
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
      "success": true,
      "id": "aa5a2f00f03616f02bde85b5a804d096ff4a23a227a8c972d26e26ba486ba940"
  }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/sendrawtransaction/coin2asset_v3
     * @apiVersion 1.0.0
     */

    wallet.all('/sendrawtransaction/coin2asset_v3', async (req, res) => {
        const {signature, address, token_name, amount, expire_time} = req.body;

        const asset = new Asset(mist_config.asimov_master_rpc);
        const [balancesErr, balances] = await to(asset.get_asset_balances(mist_wallet, mist_config.bridge_address,token_name));
        if (amount > balances[0].asim_asset_balance){
            console.error(`bridge account  only have ${balances[0].asim_asset_balance} ${token_name}`);
            return res.json({success: false, err: 'The official account have no enough balance'});
        }

        const current_time = new Date().getTime();
        if (+current_time > +expire_time) {
            return res.json({success: false, err: 'sign data expire'});
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

        const result = utils.verify(hash, signature);
        if (!result) {
            return res.json({
                success: false,
                err: 'verify failed',
            });
        }
        let fee_amount = 0;
        for (const fee of Coin2AssetFee) {
            if (token_name === fee.token) {
                fee_amount = fee.amount;
                if (amount <= fee_amount) {
                    return res.json({
                        success: false,
                        err: 'fee is not enough',
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
            success: !result3 ? false : true,
            id: !result3 ? '' : insert_info.id,
        });
    });

    wallet.all(
        '/burn_coin_tohex/:address/:token_name/:amount',
        async (req, res) => {
            const {address, token_name, amount} = req.params;
            const expire_time = 600;
            const tokens = await psql_db.get_tokens([token_name]);

            const awallet = new AsimovWallet({
                name: address,
                rpc: mist_config.asimov_child_rpc,
                address,
            });

            const balance = await awallet.contractCall.callReadOnly(
                tokens[0].address,
                'balanceOf(address)',
                [address]
            );

            const available_amount = NP.divide(balance, 100000000);

            if (available_amount < Number(amount)) {
                return res.json({
                    success: false,
                    err: `Lack of balance,you have ${available_amount} ${token_name} but want spend ${amount}`,
                });
            }

            if (expire_time <= 0 || expire_time > 3600) {
                return res.json({
                    success: false,
                    err: 'the expire_time must be less than 1 hour and more than 0',
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
                success: true,
                hash,
                expire_at,
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
      "success": true,
      "result": [
          {
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
          },
      "err": null
  }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/find_convert/8c4ddabebe95718a37aea074120d3bd133196c01812935ddef42dffcdfd431ac
     * @apiVersion 1.0.0
     */

    wallet.all('/find_convert/:id', async (req, res) => {
        const [err, convert] = await to(psql_db.find_bridge([req.params.id]));
        if (err) {
            return res.json({
                success: false,
                err,
            });
        } else if (convert && convert.length === 0) {
            return res.json({
                success: true,
                result: [],
            });
        } else {
            return res.json({
                success: true,
                result: convert[0],
            });
        }
    });


    /**
     * @api {post} /wallet/my_converts_v3/:address/:token_name/:page/:perpage my_converts_v3
     * @apiDescription Gets a record of a user's transfers in a particular asset
     * @apiName my_converts_v3
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
      "success": true,
      "result": [
          {
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
      ],
      "err": null
  }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/my_converts_v3/0x6602ca6e2820ec98cc68909fdd9f87c7bd23b62000/ETH/1/10
     * @apiVersion 1.0.0
     */
    wallet.all('/my_converts_v2/:address/:page/:perpage', async (req, res) => {
        const {address, page, perpage} = req.params;
        const offset = (+page - 1) * +perpage;
        const [err, result] = await to(psql_db.my_bridge([address, offset, perpage]));
        const success = !result ? false : true;
        res.json({success, result, err});
    });

    wallet.all(
        '/my_converts_v3/:address/:token_name/:page/:perpage',
        async (req, res) => {
            const {address, token_name, page, perpage} = req.params;
            const offset = (+page - 1) * +perpage;
            const [err, result] = await to(
                psql_db.my_bridge_v3([address, token_name, offset, perpage])
            );
            const success = !result ? false : true;
            res.json({success, result, err});
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
      "success": true,
      "result": [
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
            success: true,
            result: Coin2AssetFee,
        });
    });

    wallet.all('/sendrawtransaction/:sign_data', async (req, res) => {
        const sign_data = [req.params.sign_data];
        const [err, result] = await to(chain.sendrawtransaction(sign_data));
        res.json({result, err});
    });

    /**
     * @api {post} /wallet/my_bridge_length/:address my_bridge_length(Obsolete)
     * @apiDescription Each other to transfer the length of the record
     * @apiName my_bridge_length
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     *  {
              "success": true,
              "result": "30",
              "err": null
     *  }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/my_bridge_length/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
     * @apiVersion 1.0.0
     */

    wallet.all('/my_bridge_length/:address', async (req, res) => {
        const {address} = req.params;
        const [err, result] = await to(psql_db.my_bridge_length([address]));

        return res.json({
            success: !result ? false : true,
            result,
            err,
        });
    });

    /**
     * @api {post} /wallet/list_fingo_config list_fingo_config
     * @apiDescription Gets the configuration for fingo
     * @apiName list_fingo_config
     * @apiGroup wallet
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": {
            "dex_address": "0x630329112990e5246f67ae0de752225d56e33e3121",
            "express_address": "0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c",
            "asimov_chain_rpc": "https://rpc-fin.fingo.com",
            "bridge_address": "0x66a5e2e1d9243f9dfd1d54b31952d94043a105188f"
        }
     }
     * @apiSampleRequest http://119.23.181.166:21000/wallet/list_fingo_config
     * @apiVersion 1.0.0
     */

    wallet.all('/list_fingo_config', async (req, res) => {
        const conf = {
            dex_address: mist_config.ex_address,
            express_address: mist_config.express_address,
            asimov_chain_rpc: mist_config.asimov_chain_rpc,
            bridge_address: mist_config.bridge_address,
        };

        res.json({
            success: true,
            result: conf,
        });
    });

    return wallet;
};
