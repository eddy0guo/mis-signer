import utils2 from './utils';
import NP from 'number-precision';
import mist_config from '../../cfg';
import to from 'await-to-js'


export default class Engine {
  private db;
  private utils;

  constructor(client) {
    this.db = client;
    this.utils = new utils2();
  }

  async match(message) {
    let side = 'buy';
    if (message.side === 'buy') {
      side = 'sell';
    }

    const filter = [message.price, side, message.market_id];

    const [err,result] = await to(this.db.filter_orders(filter));
	if(!result){
		console.log('[ADEX ENGINE]::{filter_orders}',err,result);
		return [];
	}

    const match_orders = [];
    let amount = 0;
    // find and retunr。all orders。which's price below this order
    // 下单量大于匹配的总额或者或者下单量小于匹配的总额，全部成交
    for (const i in result) {
      if (!result[i]) continue;
      result[i].amount = +result[i].amount;
      result[i].available_amount = +result[i].available_amount;
      match_orders.push(result[i]);
      amount += result[i].available_amount;
      if (amount >= message.amount) {
        break;
      }
    }

    return match_orders;
  }

  async make_trades(find_orders, my_order) {
    const create_time = this.utils.get_current_time();
    const trade_arr = [];
    let amount = 0;
    for (let item = 0; item < find_orders.length; item++) {
      let maker_status = 'full_filled';
      // 最低价格的一单最后成交，成交数量按照吃单剩下的额度成交,并且更新最后一个order的可用余额
      amount = NP.plus(amount, find_orders[item].available_amount);

      // 吃单全部成交,挂单有剩余的场景,
      if (item === find_orders.length - 1 && amount > my_order.amount) {
        const overflow_amount = NP.minus(amount, my_order.amount);
        find_orders[item].available_amount = NP.minus(
          find_orders[item].available_amount,
          overflow_amount
        );
        maker_status = 'partial_filled';
      }

      const trade = {
        id: null,
        trade_hash: null,
        transaction_id: null,
        transaction_hash: null,
        status: 'matched', // 匹配完成事matched，打包带确认pending，确认ok为successful，失败为failed
        market_id: my_order.market_id,
        maker: find_orders[item].trader_address,
        taker: my_order.trader_address,
        price: find_orders[item].price,
        amount: find_orders[item].available_amount,
        taker_side: my_order.side,
        maker_order_id: find_orders[item].id,
        taker_order_id: my_order.id,
        created_at: create_time,
        updated_at: create_time,
      };

      const trade_id = this.utils.get_hash(trade);
      trade.id = trade_id;
      trade_arr.push(trade);
      const update_maker_orders_info = [
        -find_orders[item].available_amount,
        0,
        0,
        find_orders[item].available_amount,
        maker_status,
        create_time,
        find_orders[item].id,
      ];

      await this.db.update_orders(update_maker_orders_info);
    }

    return trade_arr;
  }

  async call_asimov(trades) {
    const [token_address_err,token_address] = await to(this.db.get_market([trades[0].market_id]));
	if(!token_address){
		console.log('[ADEX ENGINE]::(get_market):',token_address_err,token_address);
		return;
	}

    const [transactions_err,transactions] = await to(this.db.list_all_trades());
    const [matched_trades_err,matched_trades] = await to(this.db.list_matched_trades());
	if(!transactions || !matched_trades){
		console.log('[ADEX ENGINE]::(list_all_trades):',transactions_err,transactions);
		console.log('[ADEX ENGINE]::(list_matched_trades):',matched_trades_err,matched_trades);
		return;
	}
    const add_queue_num = Math.floor(matched_trades[0].count / 300) + 1;

    const transaction_id =
      transactions.length === 0
        ? 0
        : transactions[0].transaction_id + add_queue_num;

    const index = transaction_id % 3;
    const order_address_set = [
      token_address[0].base_token_address,
      token_address[0].quote_token_address,
      mist_config.relayers[index].address,
    ];

    const trades_arr = [];
    for (const i in trades) {
      if (!trades[i]) continue;
      const trade_info = {
        taker: trades[i].taker,
        maker: trades[i].maker,
        baseToken: order_address_set[0],
        quoteToken: order_address_set[1],
        relayer: order_address_set[2],
        baseTokenAmount: Math.round(NP.times(trades[i].amount, 100000000)), //    uint256 baseTokenAmount;
        quoteTokenAmount: Math.round(NP.times(
          trades[i].amount,
          trades[i].price,
          100000000
        )), // quoteTokenAmount;
        takerSide: trades[i].taker_side,
      };

      trades[i].transaction_id = transaction_id;
      trades[i].trade_hash = await this.utils.orderhashbytes(trade_info);

      trades_arr.push(this.utils.arr_values(trades[i]));
    }

    // 		console.log("formatch order trades_arr=%o relayers=%o transaction_id=%o index=%o",trades_arr,mist_config.relayers[index],transaction_id,index)

    await this.db.insert_trades(trades_arr);
  }
}
