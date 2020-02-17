import { AsimovWallet } from '@fingo/asimov-wallet';
import to from 'await-to-js';
import { Router } from 'express';
import NP from 'number-precision';
import * as apicache from 'apicache';
const urllib = require('url');
const crypto_sha256 = require('crypto');
const cache = apicache.middleware;

import Token from '../wallet/contract/Token';

import order1 from './api/order';
import trades1 from './api/trades';
import market1 from './api/market';
import utils1 from './api/utils';

import client1 from './models/db';
import mist_wallet1 from './api/mist_wallet';

import mist_config from '../cfg';
import Asset from '../wallet/contract/Asset';

async function get_available_erc20_amount(address, symbol) {
  const mist_wallet = new mist_wallet1();

  const client = new client1();
  const token_info = await mist_wallet.get_token(symbol);

  const token = new Token(token_info[0].address);
  const [err, res] = await to(token.balanceOf(address, 'child_poa'));
  if (err) console.error(err);
  const balance = NP.divide(Number(res), 1 * 10 ** 8);

  let freeze_amount = 0;
  const freeze_result = await client.get_freeze_amount([address, symbol]);
  if (freeze_result && freeze_result.length > 0) {
    for (const freeze of freeze_result) {
      if (freeze.side === 'buy') {
        freeze_amount = NP.plus(freeze_amount, freeze.quote_amount);
      } else if (freeze.side === 'sell') {
        freeze_amount = NP.plus(freeze_amount, freeze.base_amount);
      } else {
        console.error(`${freeze.side} error`);
      }
    }
  }

  return NP.minus(balance, freeze_amount);
}

export default () => {
  const adex = Router();
  const client = new client1();
  const order = new order1(client);
  const trades = new trades1(client);
  const market = new market1();

  const mist_wallet = new mist_wallet1();

  const utils = new utils1();
  // 	user.start();
  // 	asset.status_flushing();

  adex.all('/mist_engine_info', async (req, res) => {
    const result = await trades.get_engine_info();
    console.log(result);
    res.json({ result });
  });

  adex.all('/mist_user_overview/:address', async (req, res) => {
    const address = req.params.address;
    const [current_order_err, current_orders_length] = await to(
      order.my_orders_length(address, 'pending', 'partial_filled')
    );
    const [history_order_err, history_orders_length] = await to(
      order.my_orders_length(address, 'cancled', 'full_filled')
    );
    const [trades_err, trades_length] = await to(
      trades.my_trades_length(address)
    );
    const [birdge_err, bridge_length] = await to(
      client.my_bridge_length([address])
    );

    if (current_order_err || history_order_err || trades_err || birdge_err) {
      console.error(
        'get fingo_user_overview error',
        current_order_err,
        history_order_err,
        trades_err,
        birdge_err
      );
      return res.json({
        success: false,
      });
    }
    res.json({
      success: true,
      current_orders_length,
      history_orders_length,
      trades_length,
      bridge_length,
    });
  });

  adex.all('/list_market_quotations', async (req, res) => {
    const result = await market.list_market_quotations();
    console.log(result);
    res.json({ result });
  });

  adex.all('/list_market_quotations_v2', async (req, res) => {
    const result = await market.list_market_quotations();
    res.json({
      success: true,
      result,
    });
  });

  adex.all('/list_tokens', async (req, res) => {
    const result = await mist_wallet.list_tokens();
    console.log(result);
    res.json({ result });
  });

  adex.all('/list_tokens_v2', async (req, res) => {
    const result = await mist_wallet.list_tokens();
    res.json({
      success: true,
      result,
    });
  });

  adex.all('/get_token_price', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    const result = await mist_wallet.get_token_price2pi(obj.symbol);
    console.log(result);

    res.json({ result });
  });

  /**
     * @api {post} /adex/get_token_price_v2/:symbol 币种价格
     * @apiDescription 获取币种当前对CNYC价格
     * @apiName get_token_price_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": 831.43
     }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/get_token_price_v2/ETH
     * @apiVersion 1.0.0
     */

  adex.all('/get_token_price_v2/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const result = await mist_wallet.get_token_price2pi(symbol);
    res.json({
      success: true,
      result,
    });
  });

  adex.all('/get_token_price2btc', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    const result = await mist_wallet.get_token_price2btc(obj.symbol);
    console.log(result);

    res.json({ result });
  });

  adex.all('/balances', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    const token_arr = await mist_wallet.list_tokens();
    const balances = [];
    for (const i in token_arr as any[]) {
      if (!token_arr[i]) continue;
      const token = new Token(token_arr[i].address);
      const [err, result] = await to(token.balanceOf(obj.address));
      if (err) console.error(err);
      const [err3, allowance] = await to(
        token.allowance(obj.address, mist_config.ex_address)
      );
      if (err3) console.error(err3);
      const asset = new Asset(token_arr[i].asim_assetid);
      const [err4, assets_balance] = await to(asset.balanceOf(obj.address));
      if (err4) console.error(err4);
      let asset_balance = 0;
      for (const j in assets_balance) {
        if (token_arr[i].asim_assetid === assets_balance[j].asset) {
          asset_balance = assets_balance[j].value;
        }
      }

      const balance_info = {
        token_symbol: token_arr[i].symbol,
        token_name: token_arr[i].name,
        balance: Number(result) / (1 * 10 ** 8),
        allowance_ex: Number(allowance) / (1 * 10 ** 8),
        asim_assetid: token_arr[i].asim_assetid,
        asim_asset_balance: asset_balance,
      };

      balances.push(balance_info);
      console.log(balance_info);
    }

    res.json(balances);
  });
  /**
     * @api {post} /adex/balances_v2 全资产余额详情
     * @apiDescription 返回托管资产，币币资产，币币冻结资产的详情(建议用asset_balances或者erc20_balances替换)
     * @apiName balances_v
     * @apiGroup adex
     * @apiParam {string} address 用户地址
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "token_symbol": "CNYC",
                "erc20_address": "0x638374231575328e380610fbb12020c29e11afcd01",
                "erc20_balance": 89.578222,
                "erc20_freeze_amount": 0.17441799999999996,
                "asim_assetid": "000000000000000c00000000",
                "asim_asset_balance": "2904",
                "asset_icon": "https://www.mist.exchange/res/icons/CNYCa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/CNYCm.png"
            },
            {
                "token_symbol": "ASIM",
                "erc20_address": "0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643",
                "erc20_balance": 68.998,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000000000000",
                "asim_asset_balance": "751.1204214800001",
                "asset_icon": "https://www.mist.exchange/res/icons/ASIMa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/ASIMm.png"
            },
            {
                "token_symbol": "BTC",
                "erc20_address": "0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c",
                "erc20_balance": 0.002,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000b00000001",
                "asim_asset_balance": "0.03512235",
                "asset_icon": "https://www.mist.exchange/res/icons/BTCa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/BTCm.png"
            },
            {
                "token_symbol": "USDT",
                "erc20_address": "0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76",
                "erc20_balance": 0,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000b00000003",
                "asim_asset_balance": 0,
                "asset_icon": "https://www.mist.exchange/res/icons/USDTa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/USDTm.png"
            },
            {
                "token_symbol": "ETH",
                "erc20_address": "0x63720b32964170980b216cabbb4ecdd0979f8c9c17",
                "erc20_balance": 0.0010989,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000b00000002",
                "asim_asset_balance": 0,
                "asset_icon": "https://www.mist.exchange/res/icons/ETHa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/ETHm.png"
            },
            {
                "token_symbol": "MT",
                "erc20_address": "0x6382b81526d098e3ed8d013df2963c7410fea593d1",
                "erc20_balance": 0.5005979,
                "erc20_freeze_amount": 0,
                "asim_assetid": "000000000000000300000003",
                "asim_asset_balance": "0.93370587",
                "asset_icon": "https://www.mist.exchange/res/icons/MTa.png",
                "coin_icon": "https://www.mist.exchange/res/icons/MTm.png"
            }
        ]
    }

     * @apiSampleRequest https://poa.mist.exchange/api/adex/balances_v2?address=0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
     * @apiVersion 1.0.0
     */
  adex.all('/balances_v2', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    const token_arr = await mist_wallet.list_tokens();
    const balances = [];

    for (const i in token_arr as any[]) {
      if (!token_arr[i]) continue;
      const token = new Token(token_arr[i].address);
      const [err, result] = await to(token.balanceOf(obj.address, 'child_poa'));
      if (err) console.error(err);
      const asset = new Asset(token_arr[i].asim_assetid);
      const [err4, result4] = await to(asset.balanceOf(obj.address));
	  const assets_balance = result4[0].assets;
      if (err4) console.error(err4);
      let asset_balance = 0;
      for (const j in assets_balance) {
        if (!assets_balance[j]) continue;
        if (token_arr[i].asim_assetid === assets_balance[j].asset) {
          asset_balance = assets_balance[j].value;
        }
      }

      let freeze_amount = 0;
      const freeze_result = await client.get_freeze_amount([
        obj.address,
        token_arr[i].symbol,
      ]);
      if (freeze_result && freeze_result.length > 0) {
        for (const freeze of freeze_result) {
          if (freeze.side === 'buy') {
            freeze_amount = NP.plus(freeze_amount, freeze.quote_amount);
          } else if (freeze.side === 'sell') {
            freeze_amount = NP.plus(freeze_amount, freeze.base_amount);
          } else {
            console.error(`${freeze.side} error`);
          }
        }
      }

      const balance_info = {
        token_symbol: token_arr[i].symbol,
        erc20_address: token_arr[i].address,
        erc20_balance: Number(result) / (1 * 10 ** 8),
        erc20_freeze_amount: freeze_amount,
        asim_assetid: token_arr[i].asim_assetid,
        asim_asset_balance: asset_balance / (1 * 10 ** 8),
        asset_icon:
          mist_config.icon_url +
          token_arr[i].symbol +
          'a.png',
        coin_icon:
          mist_config.icon_url +
          token_arr[i].symbol +
          'm.png',
      };

      balances.push(balance_info);
    }

    res.json({
      success: true,
      result: balances,
    });
  });

  /**
 * @api {post} /adex/asset_balances/:address 托管资产余额
 * @apiDescription 用户的托管资产余额
 * @apiName asset_balances
 * @apiGroup express
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 {
    "success": true,
    "result": [
        {
            "token_symbol": "CNYC",
            "asim_assetid": "000000000000000c00000000",
            "asim_asset_balance": "2904",
            "value": 2904,
            "token_icon": "https://www.mist.exchange/res/icons/CNYCa.png"
        },
        {
            "token_symbol": "ASIM",
            "asim_assetid": "000000000000000000000000",
            "asim_asset_balance": "751.1212253599999",
            "value": 11559.7556582904,
            "token_icon": "https://www.mist.exchange/res/icons/ASIMa.png"
        },
        {
            "token_symbol": "BTC",
            "asim_assetid": "000000000000000b00000001",
            "asim_asset_balance": "0.03512235",
            "value": 1668.7271224005,
            "token_icon": "https://www.mist.exchange/res/icons/BTCa.png"
        },
        {
            "token_symbol": "USDT",
            "asim_assetid": "000000000000000b00000003",
            "asim_asset_balance": 0,
            "value": 0,
            "token_icon": "https://www.mist.exchange/res/icons/USDTa.png"
        },
        {
            "token_symbol": "ETH",
            "asim_assetid": "000000000000000b00000002",
            "asim_asset_balance": 0,
            "value": 0,
            "token_icon": "https://www.mist.exchange/res/icons/ETHa.png"
        },
        {
            "token_symbol": "MT",
            "asim_assetid": "000000000000000300000003",
            "asim_asset_balance": "0.93370587",
            "value": 68.6740667385,
            "token_icon": "https://www.mist.exchange/res/icons/MTa.png"
        }
    ]
}

 * @apiSampleRequest https://poa.mist.exchange/api/adex/asset_balances/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
 * @apiVersion 1.0.0
 */

  adex.all('/asset_balances/:address', async (req, res) => {
    const { address } = req.params;
    const token_arr = await mist_wallet.list_tokens();
    const balances = [];

    for (const i in token_arr as any[]) {
      if (!token_arr[i]) continue;
      const asset = new Asset(token_arr[i].asim_assetid);
      const [err4, result4] = await to(asset.balanceOf(address));
	  const assets_balance = result4[0].assets;
      if (err4) console.error(err4);
      let asset_balance = 0;
      for (const j in assets_balance) {
        if (token_arr[i].asim_assetid === assets_balance[j].asset) {
          asset_balance = assets_balance[j].value;
        }
      }
      const price = await mist_wallet.get_token_price2pi(token_arr[i].symbol);

      const balance_info = {
        token_symbol: token_arr[i].symbol,
        asim_assetid: token_arr[i].asim_assetid,
        asim_asset_balance: asset_balance / (1 * 10 ** 8),
        value: NP.times(asset_balance / (1 * 10 ** 8), price),
        token_icon:
          mist_config.icon_url +
          token_arr[i].symbol +
          'a.png',
      };

      balances.push(balance_info);
    }

    res.json({
      success: true,
      result: balances,
    });
  });

  /**
* @api {post} /adex/erc20_balances/:address 币币资产余额
* @apiDescription 用户的币币资产余额
* @apiName erc20_balances
* @apiGroup express
* @apiSuccess {json} result
* @apiSuccessExample {json} Success-Response:
{
   "success": true,
   "result": [
       {
           "token_symbol": "CNYC",
           "erc20_address": "0x638374231575328e380610fbb12020c29e11afcd01",
           "erc20_balance": 89.578222,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000c00000000",
           "value": 89.578222,
           "token_icon": "https://www.mist.exchange/res/icons/CNYCm.png"
       },
       {
           "token_symbol": "ASIM",
           "erc20_address": "0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643",
           "erc20_balance": 68.998,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000000000000",
           "value": 977.01168,
           "token_icon": "https://www.mist.exchange/res/icons/ASIMm.png"
       },
       {
           "token_symbol": "BTC",
           "erc20_address": "0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c",
           "erc20_balance": 0.002,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000b00000001",
           "value": 95.0247,
           "token_icon": "https://www.mist.exchange/res/icons/BTCm.png"
       },
       {
           "token_symbol": "USDT",
           "erc20_address": "0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76",
           "erc20_balance": 0,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000b00000003",
           "value": 0,
           "token_icon": "https://www.mist.exchange/res/icons/USDTm.png"
       },
       {
           "token_symbol": "ETH",
           "erc20_address": "0x63720b32964170980b216cabbb4ecdd0979f8c9c17",
           "erc20_balance": 0.0010989,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000b00000002",
           "value": 0.91406502,
           "token_icon": "https://www.mist.exchange/res/icons/ETHm.png"
       },
       {
           "token_symbol": "MT",
           "erc20_address": "0x6382b81526d098e3ed8d013df2963c7410fea593d1",
           "erc20_balance": 0.5005979,
           "erc20_freeze_amount": 0,
           "asim_assetid": "000000000000000300000003",
           "value": 36.813969566,
           "token_icon": "https://www.mist.exchange/res/icons/MTm.png"
       }
   ]
}
* @apiSampleRequest https://poa.mist.exchange/api/adex/erc20_balances/0x66ea4b7f7ad33b0cc7ef94bef71bc302789b815c46
* @apiVersion 1.0.0
*/
  adex.all('/erc20_balances/:address', async (req, res) => {
    const { address } = req.params;
    const token_arr = await mist_wallet.list_tokens();
    const balances = [];

    for (const i in token_arr as any[]) {
      if (!token_arr[i]) continue;
      const token = new Token(token_arr[i].address);
      const [err, result] = await to(token.balanceOf(address, 'child_poa'));
      if (err) console.error(err);

      let freeze_amount = 0;
      const freeze_result = await client.get_freeze_amount([
        address,
        token_arr[i].symbol,
      ]);
      if (freeze_result && freeze_result.length > 0) {
        for (const freeze of freeze_result) {
          if (freeze.side === 'buy') {
            freeze_amount = NP.plus(freeze_amount, freeze.quote_amount);
          } else if (freeze.side === 'sell') {
            freeze_amount = NP.plus(freeze_amount, freeze.base_amount);
          } else {
            console.error(`${freeze.side} error`);
          }
        }
      }
      const price = await mist_wallet.get_token_price2pi(token_arr[i].symbol);
      const erc20_balance = Number(result) / (1 * 10 ** 8);

      const balance_info = {
        token_symbol: token_arr[i].symbol,
        erc20_address: token_arr[i].address,
        erc20_balance,
        erc20_freeze_amount: freeze_amount,
        asim_assetid: token_arr[i].asim_assetid,
        value: NP.times(erc20_balance, price),
        token_icon:
          mist_config.icon_url +
          token_arr[i].symbol +
          'm.png',
      };

      balances.push(balance_info);
    }

    res.json({
      success: true,
      result: balances,
    });
  });

  /****

get_order_id，获取order_id,
did对order_id进行签名，获取rsv
新加个接口build_order加上order_id和rs的值去传rsv和orderid，后台去验证，通过才落表。
撮合完成之后relayer对trade信息的hash进行签名，然后合约用relayer的公钥对trade的密文rsv进行验签
  **/
  adex.all('/get_order_id', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    const message = {
      id: obj.null,
      trader_address: obj.trader_address,
      market_id: obj.marketID,
      side: obj.side,
      price: obj.price,
      amount: obj.amount,
      status: 'pending',
      type: 'limit',
      available_amount: obj.amount,
      confirmed_amount: 0,
      canceled_amount: 0,
      pending_amount: 0,
      updated_at: null,
      created_at: null,
    };
    const order_id = utils.get_hash(message);

    res.json(order_id);
  });

  /**
 * @api {post} /adex/get_order_id_v2/:trader_address/:marketID/:side/:price/:amount 获取撮合订单ID
 * @apiDescription 获取撮合订单ID
 * @apiName get_order_id_v2
 * @apiGroup adex
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 {
    "success": true,
    "result": "976528bf51cff225e267e54256191afb80c3845aa39656481dc0c6e792d8bbfa"
 }
 * @apiSampleRequest https://poa.mist.exchange/api/adex/get_order_id_v2/0x66a9ae316e1914dc8d835d5cd2ed57ab24b52a02c7/ASIM-CNYC/sell/100/6000
 * @apiVersion 1.0.0
 */

  adex.all(
    '/get_order_id_v2/:trader_address/:marketID/:side/:price/:amount',
    async (req, res) => {
      const { trader_address, marketID, side, price, amount } = req.params;
      const message = {
        id: null,
        trader_address,
        market_id: marketID,
        side,
        price,
        amount,
        status: 'pending',
        type: 'limit',
        available_amount: amount,
        confirmed_amount: 0,
        canceled_amount: 0,
        pending_amount: 0,
        updated_at: null,
        created_at: null,
      };
      const order_id = utils.get_hash(message);
      res.json({
        success: true,
        result: order_id,
      });
    }
  );

  adex.all('/build_order', async (req, res) => {
    // 打印键值对中的值
    const obj = urllib.parse(req.url, true).query;
    // test model
    /**
          let result = utils.verify(obj.order_id,JSON.parse(obj.signature));
          if(!result){
              return res.json("verify failed");
          }
          **/
    if (
      !(utils.judge_legal_num(+obj.amount) && utils.judge_legal_num(+obj.price))
    ) {
      return res.json('amount or price is cannt support');
    }
    /*
		var arr = obj.market.toString().split("-");
		let token_info = mist_wallet.get_token(arr[1]);
		let token = new Token(token_info[0].address);
        let balance = await token.balanceOf(obj.address);
		if(NP.times(+obj.amount, +obj.price) > balance){
			return res.json("balance is not enoungh");
		}
		*/

    const message = {
      id: obj.order_id,
      trader_address: obj.trader_address,
      market_id: obj.marketID,
      side: obj.side,
      price: +obj.price,
      amount: +obj.amount,
      status: 'pending',
      type: 'limit',
      available_amount: +obj.amount,
      confirmed_amount: 0,
      canceled_amount: 0,
      pending_amount: 0,
      updated_at: null,
      created_at: null,
    };

    const [err, result2] = await to(order.build(message));
    console.log(result2, err);
    res.json({ result2, err });
  });

  /**
     * @api {post} /adex/build_order_v3 创建撮合订单
     * @apiDescription 广播币币资产的划入，并且进行托管资产的划出
     * @apiName build_order_v3
     * @apiGroup adex
     * @apiParam {json}   signature         签名信息
     * @apiParam {string} trader_address    交易地址
     * @apiParam {string} market_id         交易对
     * @apiParam {string} amount            买卖数量
     * @apiParam {string} price             价格
     * @apiParam {string} order_id          订单ID
      * @apiParamExample {json} Request-Example:
      {"signature":
          {
            "r": "19e54db2a1871c6ea22f4b195598a3f368c5d7b6dd65e89deeb764ccc5782d73",
            "s": "13f2bb87c30fb3967ee0607a4acb1c42df988c4601bd0b920736da85fdea04e4",
            "pubkey": "037cfb1769aa470e139c30f8cfd17d47f44e5317ad7f5b6e31e358d1e6e3df2832"
        },
     "trader_address":"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
     "market_id":"ASIM-CNYC",
     "side":"sell",
     "price":10000,
     "amount":6,
     "order_id":"1bc97051c8e0693d03fb5fe27430bead5a11ea4047e07abba162b4a83807118e"
     }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
    {
        "success": true,
        "result": "[]",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/build_order_v3
     * @apiVersion 1.0.0
     */

  adex.all('/build_order_v3', async (req, res) => {
    const {
      trader_address,
      market_id,
      side,
      price,
      amount,
      order_id,
      signature,
    } = req.body;

    if (
      !(
        trader_address &&
        market_id &&
        side &&
        price &&
        amount &&
        order_id &&
        signature
      )
    ) {
      return res.json({
        success: false,
        err: `Params Error`,
      });
    }

    const result = utils.verify(order_id, signature);
    if (!result) {
      return res.json({
        success: false,
        err: 'verify failed',
      });
    }
    if (!(utils.judge_legal_num(+amount) && utils.judge_legal_num(+price))) {
      return res.json({
        success: false,
        err: 'amount or price is cannt support',
      });
    }

    // 参考binance下单价格限制在盘口的上下五倍
    const last_trade = await trades.list_trades(market_id);
    const max_limit = NP.times(last_trade[0].price, 5);
    const min_limit = NP.divide(last_trade[0].price, 5);

    if (price < min_limit || price > max_limit) {
      return res.json({
        success: false,
        err: `The price must be between ${min_limit} and ${max_limit}`,
      });
    }

    const [base_token, quota_token] = market_id.split('-');
    if (side === 'buy') {
      const available_quota = await get_available_erc20_amount(
        trader_address,
        quota_token
      );
      const quota_amount = NP.times(+amount, +price);
      if (quota_amount > available_quota) {
        return res.json({
          success: false,
          err: `quotation  balance is not enoungh,available amount is ${available_quota},but your order value is ${quota_amount}`,
        });
      }
    } else if (side === 'sell') {
      const available_base = await get_available_erc20_amount(
        trader_address,
        base_token
      );
      if (amount > available_base) {
        return res.json({
          success: false,
          err: `base  balance is not enoungh,available amount is ${available_base},but your want to sell ${amount}`,
        });
      }
    } else {
      return res.json({
        success: false,
        err: `side ${side} is not supported`,
      });
    }

    const message = {
      id: order_id,
      trader_address,
      market_id,
      side,
      price,
      amount,
      status: 'pending',
      type: 'limit',
      available_amount: amount,
      confirmed_amount: 0,
      canceled_amount: 0,
      pending_amount: 0,
      updated_at: null,
      created_at: null,
    };

    const [err, result2] = await to(order.build(message));
    console.log(result2, err);
    res.json({
      success: true,
      result: result2,
      err,
    });
  });

  adex.all('/cancle_order', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    /**
       let result = utils.verify(obj.order_id,JSON.parse(obj.signature));
       if(!result){
           return res.json("verify failed");
       }
       **/
    const message = {
      amount: obj.amount,
      id: obj.orderID,
    };

    const [err, result] = await to(order.cancle_order(message));
    res.json({ result, err });
  });

  /**
     * @api {post} /adex/cancle_order_v2 取消撮合订单
     * @apiDescription 取消撮合订单
     * @apiName cancle_order_v2
     * @apiGroup adex
     * @apiParam {json}   signature         签名信息
     * @apiParam {string} order_id          订单ID
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
    {
        "success": true,
        "result": "[]",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/cancle_order_v2
     * @apiVersion 1.0.0
     */

  adex.all('/cancle_order_v2', async (req, res) => {
    const { order_id, signature } = req.body;
    const success = utils.verify(order_id, signature);
    if (!success) {
      return res.json({
        success: false,
        err: 'verify failed',
      });
    }

    const order_info = await order.get_order(order_id);
    const message = {
      amount: order_info[0].available_amount,
      id: order_id,
    };

    const [err, result] = await to(order.cancle_order(message));
    res.json({
      success: !result ? false : true,
      result,
      err,
    });
  });

  adex.all('/cancle_my_order/:address', async (req, res) => {
    // 暂时只支持取消1000以内的单子
    const [err, orders] = await to(
      order.my_orders2(req.params.address, 1, 1000, 'pending', 'partial_filled')
    );
    console.log('cancle_my_order=', orders, err, req.params.address);

    if (!err) {
      for (const index in orders) {
        if (!orders[index]) continue;
        const message = {
          amount: orders[index].available_amount,
          id: orders[index].id,
        };
        console.log('cancle_my_order', message);

        const [err2, result] = await to(order.cancle_order(message));
        if (err2) {
          console.error(err2, result);
          return res.json({
            success: false,
            err2,
          });
        }
      }
    }

    res.json({
      success: true,
    });
  });

  /**
     * @api {post} /adex/cancle_orders 取消用户所有撮合订单
     * @apiDescription 取消用户所有撮合订单
     * @apiName cancle_orders_v2
     * @apiGroup adex
     * @apiParam {json}   signature         签名信息
     * @apiParam {String[]} orders_id          订单ID
     * @apiParam {string} address           用户地址
     * @apiParamExample {json} Request-Example:
     *       {"address":"0x66e03763123f479fdb1ead7ad8a5b8a7d2f7cda64d",
     * "orders_id":["afe61f5c6197947f13d836bc89753d38e922e3e816ec5bb5bd8c74ccd5a9e0a1","6ceb8a97ac53567c6d79db09685b815a2708f845d427a7e0a3d9a4f0e89cb83c1"],
     * "signature":{"r":"8761246c1539182ddbcaf5c2b36f17a188dbd26b3879267882375debe458e84a",
     * "s":"358f8cc504f83f426136b7999c931103ac81bfeb3e2d2fb0fd7eee8b4c43a2ac",
     * "pubkey":"036b5f0cac8c822c17f3eb6cba466dd8b4720e7450cd607cb69967fbeb9ec6b32d"}
            }
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
    {
        "success": true,
        "result": "[]",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/cancle_order_v2
     * @apiVersion 1.0.0
     */

  adex.all('/cancle_orders_v2', async (req, res) => {
    const { address, orders_id, signature } = req.body;
    console.log('cancle_orders_v2', address, orders_id, signature);
    const str = orders_id.join();
    const root_hash = crypto_sha256.createHmac('sha256', '123');
    const hash = root_hash.update(str, 'utf8').digest('hex');
    console.log('cancle_orders_v2--', hash);
    const success = utils.verify(hash, signature);
    if (!success) {
      return res.json({
        success: false,
        err: 'verify failed',
      });
    }

    const results = [];
    const errs = [];
    for (const index in orders_id) {
      if (!orders_id[index]) continue;
      const order_info = await order.get_order(orders_id[index]);
      // 已经取消过的不报错直接跳过
      if (order_info[0].available_amount <= 0) {
        continue;
      }
      // 不能取消别人的订单
      if (order_info[0].trader_address !== address) {
        return res.json({
          success: false,
          err: 'You can‘t cancel others order',
        });
      }

      const message = {
        amount: order_info[0].available_amount,
        id: order_info[0].id,
      };

      const [err, result] = await to(order.cancle_order(message));
      if (err) {
        errs.push(err);
      } else {
        results.push(result);
      }
    }

    return res.json({
      success: errs.length === 0 ? true : false,
      result: results,
      err: errs,
    });
  });

  adex.all('/list_orders', async (req, res) => {
    const [err, result] = await to(order.list_orders());

    res.json({ result, err });
  });

  /**
     * @api {post} /adex/my_trades_length/:address 用户历史成交数
     * @apiDescription 获取用户历史成交总数
     * @apiName my_trades_length
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
    {
        "success": true,
        "result": "748549",
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/my_trades_length/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9
     * @apiVersion 1.0.0
     */
  adex.all('/my_trades_length/:address', async (req, res) => {
    const { address } = req.params;
    const [err, result] = await to(trades.my_trades_length(address));

    res.json({
      success: !result ? false : true,
      result,
      err,
    });
  });

  adex.all('/my_orders', async (req, res) => {
    /**
         let message = {address:"0x66b7637198aee4fffa103fc0082e7a093f81e05a64"}
         **/
    const obj = urllib.parse(req.url, true).query;
    const message = { address: obj.address };

    const [err, result] = await to(order.my_orders(message));

    res.json({ result, err });
  });

  adex.all(
    '/my_orders2/:address/:page/:perpage/:status1/:status2',
    async (req, res) => {
      // pending,partial_filled,当前委托
      // cancled，full_filled，历史委托
      const { address, page, perpage, status1, status2 } = req.params;
      const [err, result] = await to(
        order.my_orders2(address, page, perpage, status1, status2)
      );
      res.json({ result, err });
    }
  );

  /**
     * @api {post} /adex/my_orders_v2/:address/:page/:perpage/:status1/:status2 获取订单列表
     * @apiDescription 获取用户历史成交列表,status包含4种:pending,partial_filled,cancled，full_filled
     * @apiName my_orders_v2
     * @apiGroup adex
     * @apiSuccess {json} result
     * @apiSuccessExample {json} Success-Response:
     {
        "success": true,
        "result": [
            {
                "id": "eca409738aca8385fbf77f5dcd6c629be220fbefe8b423ed1db412f118e9b774",
                "trader_address": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
                "market_id": "ETH-USDT",
                "side": "sell",
                "price": "136.47000000",
                "amount": "36.42330000",
                "status": "pending",
                "type": "limit",
                "available_amount": "36.42330000",
                "confirmed_amount": "0.00000000",
                "canceled_amount": "0.00000000",
                "pending_amount": "0.00000000",
                "updated_at": "2019-12-31T05:28:10.644Z",
                "created_at": "2019-12-31T05:28:10.644Z"
            }
        ],
        "err": null
    }
     * @apiSampleRequest https://poa.mist.exchange/api/adex/my_orders_v2/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/1/pending/fullfuilled
     * @apiVersion 1.0.0
     */

  adex.all(
    '/my_orders_v2/:address/:page/:perpage/:status1/:status2',
    async (req, res) => {
      // pending,partial_filled,当前委托
      // cancled，full_filled，历史委托
      const { address, page, perpage, status1, status2 } = req.params;
      const [err, result] = await to(
        order.my_orders2(address, page, perpage, status1, status2)
      );

      res.json({
        success: !result  ? false : true,
        result,
        err,
      });
    }
  );

  adex.all('/order_book', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;

    const [err, result] = await to(order.order_book(obj.marketID));
    res.json({ result, err });
  });

  adex.all('/order_book_v2/:market_id', async (req, res) => {
    const [err, result] = await to(order.order_book(req.params.market_id));

    if (err) console.error(err);

    // 没数据判定为不存在的交易对，实际上刚部署的时候也没数据
    if (result.asks.length === 0 && result.asks.length === 0) {
      res.json({
        success: false,
        err: 'MarketID not found',
      });
    } else {
      res.json({
        success: true,
        result,
      });
    }
  });

  adex.all('/list_markets_v2', async (req, res) => {
    const [err, result] = await to(market.list_markets());
    res.json({
      success: !result ? false : true,
      result,
      err,
    });
  });

  adex.all('/list_online_markets', async (req, res) => {
    const [err, result] = await to(market.list_online_markets());
    res.json({
      success: !result ? false : true,
      result,
      err,
    });
  });

	adex.all('/market_up/:market_id', async (req, res) => {
		const {market_id} = req.params;
		const [err, result] = await to(market.market_up(market_id));
		res.json({
		  success: !result ? false : true,
		  result,
		  err,
		});
	  });

	adex.all('/market_down/:market_id', async (req, res) => {
		const {market_id} = req.params;
		const [err, result] = await to(market.market_down(market_id));
		res.json({
		  success: !result ? false : true,
		  result,
		  err,
		});
	  });


	adex.all('/market_add/:market_id/:base_token_address/:base_token_symbol/:quote_token_address/:quote_token_symbol', async (req, res) => {
		let info = utils.arr_values(req.params);
		const [err, result] = await to(market.market_add(info));
		res.json({
		  success: !result ? false : true,
		  result,
		  err,
		});
	  });

  adex.all('/rollback_trades', async (req, res) => {
    const [err, result] = await to(trades.rollback_trades());

    res.json({ result, err });
  });

  adex.all('/list_trades', async (req, res) => {
    const obj = urllib.parse(req.url, true).query;
    const [err, result] = await to(trades.list_trades(obj.marketID));
    res.json({ result, err });
  });

  adex.all('/list_trades_v2/:market_id', async (req, res) => {
    const { market_id } = req.params;

    const [err, result] = await to(market.get_market(market_id));
    if (err || !result || result.length === 0) {
      res.json({
        success: false,
        err: err + ' or have no this market',
      });
    }

    const [err2, result2] = await to(trades.list_trades(market_id));

    if (err2) {
      res.json({
        success: false,
        err: err2,
      });
    } else {
      res.json({
        success: true,
        result: result2,
      });
    }
  });

  adex.all('/my_trades', async (req, res) => {
    /**
          let message = {address:"0x66b7637198aee4fffa103fc0082e7a093f81e05a64"}
  **/
    const obj = urllib.parse(req.url, true).query;
    const message = { address: obj.address };
    const [err, result] = await to(trades.my_trades(message));

    res.json({ result, err });
  });

  adex.all('/my_trades2/:address/:page/:per_page', async (req, res) => {
    const [err, result] = await to(
      trades.my_trades2(
        req.params.address,
        req.params.page,
        req.params.per_page
      )
    );
    res.json({
      success: !result ? false : true,
      result,
      err,
    });
  });

  /**
* @api {post} /adex/my_trades_v2/:address/:page/:perpage/ 获取历史成交列表
* @apiDescription 获取用户历史成交列表
* @apiName my_trades_v2
* @apiGroup adex
* @apiSuccess {json} result
* @apiSuccessExample {json} Success-Response:
{
   "success": true,
   "result": [
       {
           "id": "a55b5c0b6e269a5851ecb40def6191a77c5c6e4d57106f402339edbe60a51fa9",
           "trade_hash": "0x53f3fe73e5a90292070f168fc22786208532b80d5207e195cacb9c98ddc4ffde",
           "transaction_id": 40717,
           "transaction_hash": null,
           "status": "matched",
           "market_id": "ETH-USDT",
           "maker": "0x66b7637198aee4fffa103fc0082e7a093f81e05a64",
           "taker": "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
           "price": "126.66000000",
           "amount": "3.39450000",
           "taker_side": "buy",
           "maker_order_id": "32eb0fb52699a456f51f605b8190b823c56b780da6fa4a60e8b58006f059e702",
           "taker_order_id": "1fc99c3ef934b4f5055bf70d8d21ba0b2bac93cfdedfd7a0b9003c021aa721e4",
           "updated_at": "2019-12-31T05:32:41.699Z",
           "created_at": "2019-12-31T05:32:41.699Z"
       }
   ],
   "err": null
}

* @apiSampleRequest https://poa.mist.exchange/api/adex/my_trades_v2/0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9/1/1
* @apiVersion 1.0.0
*/

  adex.all('/my_trades_v2/:address/:page/:per_page', async (req, res) => {
    const [err, result] = await to(
      trades.my_trades2(
        req.params.address,
        req.params.page,
        req.params.per_page
      )
    );
    res.json({
      success: !result ? false : true,
      result,
      err,
    });
  });

  // add 10 second memory cache ( change to redis later )
  adex.all('/trading_view', cache('10 second'), async (req, res) => {
    const current_time = Math.floor(new Date().getTime() / 1000);
    const obj = urllib.parse(req.url, true).query;

    const message = {
      market_id: obj.marketID,
      from:
        current_time -
        (current_time % obj.granularity) -
        obj.granularity * obj.number, // 当前所在的时间区间不计算
      to: current_time - (current_time % obj.granularity),
      granularity: obj.granularity,
    };

    const [err, result] = await to(trades.trading_view(message));
    res.json({ result, err });
  });

  adex.all(
    '/trading_view_v2/:granularity/:number/:market_id',
    cache('10 second'),
    async (req, res) => {
      const { granularity, number, market_id } = req.params;

      const [err, result] = await to(market.get_market(market_id));
      if (err || !result || result.length === 0) {
        res.json({
          success: false,
          err: err + ' or have no this market',
        });
      }

      const current_time = Math.floor(new Date().getTime() / 1000);
      const message = {
        market_id,
        from:
          current_time - (current_time % granularity) - granularity * number, // 当前所在的时间区间不计算
        to: current_time - (current_time % granularity),
        granularity,
      };

      const [err2, result2] = await to(trades.trading_view(message));
      if (err2) {
        res.json({
          success: false,
          err: err2,
        });
      } else {
        res.json({
          success: true,
          result: result2,
        });
      }
    }
  );

  adex.all(
    '/trading_view_v2/:granularity/:number/:market_id',
    cache('10 second'),
    async (req, res) => {
      const { granularity, number, market_id } = req.params;

      const [err, result] = await to(market.get_market(market_id));
      if (err || !result || result.length === 0) {
        res.json({
          success: false,
          err: err + ' or have no this market',
        });
      }

      const current_time = Math.floor(new Date().getTime() / 1000);
      const message = {
        market_id,
        from:
          current_time - (current_time % granularity) - granularity * number, // 当前所在的时间区间不计算
        to: current_time - (current_time % granularity),
        granularity,
      };

      const [err2, result2] = await to(trades.trading_view(message));
      if (err2) {
        res.json({
          success: false,
          err: err2,
        });
      } else {
        res.json({
          success: true,
          result: result2,
        });
      }
    }
  );

  return adex;
};
