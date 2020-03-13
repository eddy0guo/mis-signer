import to from 'await-to-js'
import NP from 'number-precision'

import Exchange from './Exchange'

import DBClient from '../adex/models/db'
import Utils from '../adex/api/utils'
import MistConfig from '../cfg'

import { AsimovWallet, BlockChain } from '@fingo/asimov-wallet'

class Launcher {
    private db:DBClient;
    private utils:Utils;
    private block_height;
    private tmp_transaction_id;
    private relayer:AsimovWallet;
    private mist:Exchange;
    private errorCount:number = 0;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.block_height = 0;

        this.relayer = new AsimovWallet({
            name: 'Exchange_Relayer',
            rpc: MistConfig.asimov_child_rpc,
            mnemonic: MistConfig.relayers[0].prikey,
          });
        this.mist = new Exchange(MistConfig.ex_address,this.relayer);
    }

    start(ms: number = 100): void {
        setTimeout(async () => {
            await this.loop();
        }, ms);
    }

    async loop(): Promise<void> {

        // TODO：高度检查的逻辑暂时保留
        const blockHeight = BlockChain.tracker.height;
        if ( blockHeight === this.block_height) {
            console.log(`[ADEX LAUNCHER] current height is ${blockHeight} and last is ${this.block_height}`);
            this.start(500);
            return
        }

        const [trades_err, trades] = await to(this.db.get_laucher_trades());
        if (!trades) {
            console.error('get_laucher_trades error count',this.errorCount,trades_err, trades);
            if( this.errorCount++ > 1000 ){
                console.error('Too many db errors, kill process, goodbye...', this.errorCount);
                // Maybe you shold kill the process
                process.exit(-1);
            }
            // 这里原本会出现主循环停止的问题。
            this.start(500);
            return;
        }

        if ( !trades || trades.length <= 0 ) {
            console.log('[Launcher] No matched trades')
            this.start(1000);
            return;
        }

        const current_time = this.utils.get_current_time();
        // 只要进入laucher阶段就先把状态设置为pending，防止engine那边在laucher的时候，继续在当前transaction_id里继续插数据
        this.tmp_transaction_id = trades[0].transaction_id;

        const update_trade_info = ['pending', undefined, current_time, trades[0].transaction_id];
        await this.db.launch_update_trades(update_trade_info);

        // 准备laucher之前先延时2秒,waiting locked in db?
        // mt 3s 一个块，所以目前问题不大。但是utxo已经拆分，其实可以更快速度进行launch
        setTimeout(async () => {
            await this.doLaunch(trades,current_time);
        }, 1000);
    }

    async doLaunch(trades,current_time){
        const [tx_trades_err, tx_trades] = await to(this.db.transactions_trades([this.tmp_transaction_id]));
        if (!tx_trades || tx_trades_err) {
            console.error('[ADEX LAUNCHER]::(transactions_trades):', tx_trades_err, tx_trades);
            this.loop.call(this);
            return;
        }

        const trades_hash = [];
        const [markets_err, markets] = await to(this.db.list_online_markets());
        if (!markets) {
            console.error('[ADEX LAUNCHER]::(list_online_markets):', markets_err, markets);
            this.loop.call(this);
            return;
        }
        for (const one_trade of tx_trades) {

            let token_address;
            for (const j in markets) {
                if (one_trade.market_id === markets[j].id) {
                    token_address = markets[j];
                }
            }

            if (!token_address) {
                console.error('not supported token_address');
                continue;
            }

            const base_amount = Math.round(NP.times(+one_trade.amount, 100000000));
            const quote_amount = Math.round(NP.times(+one_trade.amount, +one_trade.price, 100000000));

            const trade_info = {
                trade_hash: one_trade.trade_hash,
                taker: one_trade.taker,
                maker: one_trade.maker,
                base_token_address: token_address.base_token_address,
                quote_token_address: token_address.quote_token_address,
                relayer: this.relayer.address,
                base_token_amount: base_amount,
                quote_token_amount: quote_amount,
                r: null,
                s: null,
                side: one_trade.taker_side,
                v: null
            };
            trades_hash.push(trade_info);
        }

        const [err, txid] = await to(this.mist.matchorder(trades_hash));
        this.block_height = BlockChain.tracker.height;

        if (!err) {
            const updatedInfo = ['pending', txid, current_time, trades[0].transaction_id];
            await this.db.begin();
            const [updatedInfoErr, updatedInfoResult] = await to(this.db.launch_update_trades(updatedInfo));
            if (!updatedInfoResult) {
                console.error(`[ADEX LAUCNER]:launch_update_trades failed %o`, updatedInfoErr);
                await this.db.rollback();
                this.loop.call(this);
                return;
            }

            const TXinfo = [trades[0].transaction_id, txid, trades[0].market_id, 'pending', 'pending', current_time, current_time];
            const [insertTransactionsErr, insertTransactionsResult] = await to(this.db.insert_transactions(TXinfo));
            if (!insertTransactionsResult) {
                console.error(`[ADEX LAUCNER]:launch_update_trades failed %o`, insertTransactionsErr);
                await this.db.rollback();
                this.loop.call(this);
                return;
            }
            this.db.commit();
        } else {
            const errInfo = ['matched', null, current_time, trades[0].transaction_id];
            await this.db.launch_update_trades(errInfo);
            console.log('[ADEX LAUNCHER] call dex matchorder err=%o transaction_id=%o relayers=%o\n', err, trades[0].transaction_id, this.relayer.address)
        }

        this.loop.call(this);
    }
}

process.on('unhandledRejection', (reason, p) => {
    console.log('[ADEX LAUNCHER]Unhandled Rejection at: Promise reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const lancher = new Launcher()
lancher.start();
