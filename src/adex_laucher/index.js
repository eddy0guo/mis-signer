import client from '../adex/models/db'
import utils2 from '../adex/api/utils'
import to from 'await-to-js'
import mist_config from '../cfg'
import mist_ex10 from '../wallet/contract/mist_ex10'
import NP from 'number-precision'

class launcher {

    tmp_transaction_id;

    constructor() {
        this.db = new client;
        this.utils = new utils2;
        this.start();
    }

    async start() {
        this.loop()
    }

    async loop() {

        let trades = await this.db.get_laucher_trades();
        let current_time = this.utils.get_current_time();
        if (trades.length == 0) {
            console.log("have no matched trades")
            setTimeout(() => {
                this.loop.call(this)
            }, 3000);
            return
        }

        //只要进入laucher阶段就先把状态设置为pending，防止engine那边在laucher的时候，继续在当前transaction_id里继续插数据
        this.tmp_transaction_id = trades[0].transaction_id;

        let update_trade_info = ['pending', undefined, current_time, trades[0].transaction_id];
        await this.db.launch_update_trades(update_trade_info);
        //准备laucher之前先延时2秒
        setTimeout(async () => {
            let trades = await this.db.transactions_trades([this.tmp_transaction_id]);
            let index = trades[0].transaction_id % 3;
            let trades_hash = [];
            let markets = await this.db.list_markets();
            for (let i in trades) {
                //耗时
                //let token_address = await this.db.get_market([trades[i].market_id]);
                let token_address;
                for (let j in markets) {
                    if (trades[i].market_id == markets[j].id) {
                        token_address = markets[j];
                    }
                }

                if (token_address == undefined) {
                    console.error("not support market id");
                    continue;
                }

                let trade_info = {
                    trade_hash: trades[i].trade_hash,
                    taker: trades[i].taker,
                    maker: trades[i].maker,
                    base_token_address: token_address.base_token_address,
                    quote_token_address: token_address.quote_token_address,
                    relayer: mist_config.relayers[index].address,
                    base_token_amount: NP.times(+trades[i].amount, 100000000), //    uint256 baseTokenAmount;
                    quote_token_amount: NP.times(+trades[i].amount, +trades[i].price, 100000000), // quoteTokenAmount;
                    r: null,
                    s: null,
                    side: trades[i].taker_side,
                    v: null
                };
                //后边改合约传结构体数据
                trades_hash.push(trade_info);
            }

            let mist = new mist_ex10(mist_config.ex_address);
            let [err, txid] = await to(mist.matchorder(trades_hash, mist_config.relayers[index].prikey, mist_config.relayers[index].word));

            //console.log("formatchorder----tradeshash=%o--relayers=%o--transaction_id=%o--index=%o--", trades_hash,mist_config.relayers[index],trades[0].transaction_id ,index);


            if (!err) {
                let update_trade_info = ['pending', txid, current_time, trades[0].transaction_id];
                await this.db.launch_update_trades(update_trade_info);

                let TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, "pending", "pending", trades[0].created_at, trades[0].created_at];
                this.db.insert_transactions(TXinfo);
            } else {

                let update_trade_info = ['matched', , current_time, trades[0].transaction_id];
                await this.db.launch_update_trades(update_trade_info);
                //  console.log("---call_asimov_result33333time--sendraw--err--", trades[0].transaction_id, mist_config.relayers[index].address)
            }
            setTimeout(() => {
                this.loop.call(this)
            }, 10000);
        }, 5000);

    }


}

export default new launcher()
