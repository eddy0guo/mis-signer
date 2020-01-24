import to from 'await-to-js';
import NP from 'number-precision';
import { Router } from 'express';

import { chain } from '../wallet/api/chain';

import mist_wallet1 from '../adex/api/mist_wallet';
import order1 from '../adex/api/order';
import utils1 from '../adex/api/utils';
import psql from './models/db';

import mist_config from '../cfg';
import Asset from '../wallet/contract/Asset';

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

async function get_price(base_token_name, quote_token_name, amount, order) {
  let base_value = 0;
  let base_amount = 0;
  if (base_token_name !== 'CNYC') {
    const base_book = await order.order_book(base_token_name + '-CNYC');
    const base_bids = base_book.bids;
    // 模拟先卖掉所有base，再全部买quote
    for (const index in base_bids) {
      if (!base_bids[index]) continue;
      const tmp_amount = base_amount;
      base_amount += +base_bids[index][1];
      if (base_amount >= amount) {
        base_value += NP.times(amount - tmp_amount, base_bids[index][0]);
        break;
      } else {
        // amount * price
        base_value += NP.times(base_bids[index][1], base_bids[index][0]);
      }
    }
  } else {
    base_value = NP.times(amount, 1);
  }

  let quote_value = 0;
  let quote_amount = 0;
  if (quote_token_name !== 'CNYC') {
    const quote_book = await order.order_book(quote_token_name + '-CNYC');
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
  const mist_wallet = new mist_wallet1();
  const psql_db = new psql();
  const utils = new utils1();
  const order = new order1(psql_db);

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
    const { address, page, perpage } = req.params;
    const offset = (+page - 1) * +perpage;
    const [err, records] = await to(
      psql_db.my_express([address, offset, perpage])
    );

    for (const record of records as any[]) {
      record.base_token_icon =
        'http://fingo-cdn.asimov.work/res/icons/' +
        record.base_asset_name +
        'a.png';
      record.quote_token_icon =
        'http://fingo-cdn.asimov.work/res/icons/' +
        record.quote_asset_name +
        'a.png';
    }
    res.json({
      success: records === undefined ? false : true,
      result: records,
      err,
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
    const { trade_id } = req.params;
    const [err, record] = await to(psql_db.find_express([trade_id]));
    if (err) {
      return res.json({
        success: false,
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
        'http://fingo-cdn.asimov.work/res/icons/' +
        record[0].base_asset_name +
        'a.png';
      record[0].quote_token_icon =
        'http://fingo-cdn.asimov.work/res/icons/' +
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
      result: express_config,
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

  express.all(
    '/get_price/:base_token_name/:quote_token_name/:base_amount',
    async (req, res) => {
      const { base_token_name, quote_token_name, base_amount } = req.params;
      const [err, price] = await to(
        get_price(base_token_name, quote_token_name, base_amount, order)
      );
      res.json({
        success: price === undefined ? false : true,
        result: price,
        err,
      });
    }
  );

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
    const { address } = req.params;
    const [err, result] = await to(psql_db.my_express_length([address]));
    res.json({
      success: result === undefined ? false : true,
      result,
      err,
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
    const token_arr = await mist_wallet.list_tokens();

    const balances = [];
    for (const i in token_arr as any[]) {
      if (!token_arr[i]) continue;
      const asset = new Asset(token_arr[i].asim_assetid);
      const [err4, assets_balance] = await to(
        asset.balanceOf(mist_config.express_address)
      );
      if (err4) console.error(err4);
      let asset_balance = 0;
      for (const j in assets_balance) {
        if (token_arr[i].asim_assetid === assets_balance[j].asset) {
          asset_balance = assets_balance[j].value;
        }
      }
      const icon =
        'http://fingo-cdn.asimov.work/res/icons/' +
        token_arr[i].symbol +
        'a.png';
      const balance_info = {
        token_symbol: token_arr[i].symbol,
        asim_asset_id: token_arr[i].asim_assetid,
        asim_asset_balance: asset_balance,
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

  express.all(
    '/sendrawtransaction/build_express/:base_token_name/:quote_token_name/:amount/:address/:sign_data',
    async (req, res) => {
      const {
        base_token_name,
        quote_token_name,
        amount,
        address,
        sign_data,
      } = req.params;
      const [base_err, base_txid] = await to(
        chain.sendrawtransaction([sign_data])
      );
      const base_tx_status = base_txid === undefined ? 'failed' : 'successful';

      // 失败的记录也入表

      // let base_token_price = await mist_wallet.get_token_price2pi(base_token_name);
      // let quote_token_price = await mist_wallet.get_token_price2pi(quote_token_name);

      // 根据深度取价格
      const [err, price] = await to(
        get_price(base_token_name, quote_token_name, amount, order)
      );
      if (err) console.error(err);

      const quote_amount = NP.times(amount, Number(price), 0.995);
      const fee_amount = NP.times(amount, Number(price), 0.005);

      let quote_tx_status, quote_err, quote_txid;
      if (!base_err) {
        const tokens = await psql_db.get_tokens([quote_token_name]);
        const asset = new Asset(tokens[0].asim_assetid);

        [quote_err, quote_txid] = await to(
          asset.transfer(address, quote_amount)
        );
        quote_tx_status = quote_txid === undefined ? 'failed' : 'successful';
      }

      const info = {
        trade_id: null,
        address,
        base_asset_name: base_token_name,
        base_amount: amount,
        price,
        quote_asset_name: quote_token_name,
        quote_amount,
        fee_rate: 0.005,
        fee_token: quote_token_name,
        fee_amount,
        base_txid,
        base_tx_status,
        quote_txid,
        quote_tx_status,
      };
      info.trade_id = utils.get_hash(info);
      const info_arr = utils.arr_values(info);

      const [err3, result3] = await to(psql_db.insert_express(info_arr));
      if (err3) console.error(err3, result3);
      let success;
      if (
        base_tx_status === 'successful' &&
        quote_tx_status === 'successful' &&
        !err3
      ) {
        success = true;
      } else {
        success = false;
      }
      res.json({
        success,
        trade_id: info.trade_id,
        base_err,
        quote_err,
      });
    }
  );

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
     * @apiSampleRequest https://poa.mist.exchange/api/express/sendrawtransaction/build_express_v2/ETH/xxx
     * @apiVersion 1.0.0
     */

  express.all(
    '/sendrawtransaction/build_express_v2/:quote_token_name/:sign_data',
    async (req, res) => {
      const { quote_token_name, sign_data } = req.params;
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
          quote_asset_name: quote_token_name,
          quote_amount: null,
          fee_rate: 0.005,
          fee_token: quote_token_name,
          fee_amount: null,
          base_txid,
          base_tx_status: 'pending',
          quote_txid: null,
          quote_tx_status: 'pending',
        };
        info.trade_id = utils.get_hash(info);
        trade_id = info.trade_id;
        const info_arr = utils.arr_values(info);

        const [err3, result3] = await to(psql_db.insert_express(info_arr));
        if (err3) console.error(err3, result3);
        res.json({
          success: true,
          trade_id: info.trade_id,
        });
      } else {
        res.json({
          success: false,
          err: base_err,
        });
      }
      setTimeout(async () => {
        // 失败的记录也入表
        const [decode_err, decode_info] = await to(
          utils.decode_transfer_info(base_txid)
        );
        const {
          from,
          asset_id,
          vin_amount,
          to_amount,
          remain_amount,
        } = decode_info;

        let base_tx_status;
        if (!decode_err) {
          base_tx_status = 'successful';
        } else {
          console.error(
            decode_err,
            from,
            asset_id,
            vin_amount,
            to_amount,
            remain_amount
          );
          base_tx_status = 'illegaled';
        }

        if (decode_info.to !== mist_config.express_address) {
          base_tx_status = 'illegaled';
          console.error(`reciver ${decode_info.to}  is not official address`);
        }

        const [err3, base_token] = await to(psql_db.get_tokens([asset_id]));
        if (err3 || !base_token || base_token.length === 0) {
          base_tx_status = 'illegaled';
          console.error(`asset ${asset_id}  is not support`);
        }

        const [err, price] = await to(
          get_price(base_token[0].symbol, quote_token_name, to_amount, order)
        );
        if (err) console.error(err);
        const current_time = utils.get_current_time();

        const quote_amount = NP.times(to_amount, Number(price), 0.995);
        const fee_amount = NP.times(to_amount, Number(price), 0.005);

        const info = {
          address: from,
          base_asset_name: base_token[0].symbol,
          base_amount: to_amount,
          price,
          quote_amount,
          fee_amount,
          base_tx_status,
          quote_tx_status: 'pending',
          updated_at: current_time,
          trade_id,
        };
        const info_arr = utils.arr_values(info);
        //  todo:deal error
        const [err4, result4] = await to(psql_db.update_base(info_arr));

        if (err4) console.error(err4, result4);
      }, 10000);
    }
  );

  return express;
};
