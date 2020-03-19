import to from 'await-to-js';
import NP from 'number-precision';

import Exchange from './Exchange';

import DBClient from '../adex/models/db';
import Utils from '../adex/api/utils';
import MistConfig from '../cfg';
import { Logger } from '../common/Logger';
import LogUnhandled from '../common/LogUnhandled';

import { AsimovWallet } from '@fingo/asimov-wallet';

class Launcher {
    private db: DBClient;
    private utils: Utils;
    private tmpTransactionId;
    private relayer: AsimovWallet;
    private mist: Exchange;
    private errorCount: number = 0;
    // 5分钟无log输出会杀死进程。
    private logger: Logger = new Logger(Launcher.name, 5 * 60 * 1000);

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();

        this.relayer = new AsimovWallet({
            name: 'Exchange_Relayer',
            rpc: MistConfig.asimov_child_rpc,
            pk: MistConfig.relayers[0].prikey,
        });
        this.mist = new Exchange(MistConfig.ex_address, this.relayer);
    }

    async start() {
        while (true) {
            const start = new Date();
            this.logger.log(`Main loop started at:${start.toString()}ms`);
            const [err] = await to(this.mainLoop());
            if (err) {
                this.logger.log(`Catched Main Loop Error:${err}`);
            }
            this.logger.log(
                `Main loop finished in:${new Date().getTime() - start.getTime()}ms`
            );
        }
    }

    async sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    countError(err: Error) {
        this.errorCount++;
        if (this.errorCount > 100) {
            this.logger.log(
                'Too many db errors, kill process, goodbye...',
                this.errorCount,
                err
            );
            // Maybe you shold kill the process
            process.exit(-1);
        } else {
            this.logger.log('Count Error', this.errorCount, err);
        }
    }

    async mainLoop(): Promise<void> {
        const [trades_err, trades] = await to(this.db.get_laucher_trades());
        if (trades_err) {
            this.logger.log('get_laucher_trades error', trades_err, trades);
            this.countError(trades_err);
            return await this.sleep(500);
        }

        if (!trades || trades.length <= 0) {
            this.logger.log('No matched trades');
            return await this.sleep(1000);
        }

        const current_time = this.utils.get_current_time();
        // 只要进入laucher阶段就先把状态设置为pending
        // 防止engine那边在laucher的时候，继续在当前transaction_id里继续插数据
        this.tmpTransactionId = trades[0].transaction_id;

        const update_trade_info = [
            'pending',
            undefined,
            current_time,
            trades[0].transaction_id,
        ];
        const [launchUpdateErr, launchUpdateRes] = await to(
            this.db.launch_update_trades(update_trade_info)
        );
        if (launchUpdateErr || !launchUpdateRes) {
            return await this.sleep(500);
        }

        // 准备laucher之前先延时2秒,waiting locked in db?
        // mt 3s 一个块，所以目前问题不大。
        // 但是utxo已经主动拆分，其实可以更快速度进行launch，按目前的拆分可以一个块提交10个以内交易。
        await this.sleep(500);
        return this.doLaunch(trades, current_time);
    }

    async doLaunch(trades, current_time): Promise<void> {
        const [tx_trades_err, tx_trades] = await to(
            this.db.transactions_trades([this.tmpTransactionId])
        );
        if (!tx_trades || tx_trades_err) {
            this.logger.log(
                '[ADEX LAUNCHER]::(transactions_trades):',
                tx_trades_err,
                tx_trades
            );
            return;
        }

        const trades_hash = [];
        const [markets_err, markets] = await to(this.db.list_online_markets());
        if (!markets) {
            this.logger.log(
                '[ADEX LAUNCHER]::(list_online_markets):',
                markets_err,
                markets
            );
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
                this.logger.log('not supported token_address');
                continue;
            }

            const base_amount = Math.round(NP.times(+one_trade.amount, 100000000));
            const quote_amount = Math.round(
                NP.times(+one_trade.amount, +one_trade.price, 100000000)
            );

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
                v: null,
            };
            trades_hash.push(trade_info);
        }

        const [err, txid] = await to(this.mist.matchorder(trades_hash));

        if (!err) {
            const updatedInfo = [
                'pending',
                txid,
                current_time,
                trades[0].transaction_id,
            ];
            await this.db.begin();
            const [updatedInfoErr, updatedInfoResult] = await to(
                this.db.launch_update_trades(updatedInfo)
            );
            if (!updatedInfoResult) {
                this.logger.log(
                    `[ADEX LAUCNER]:launch_update_trades failed %o`,
                    updatedInfoErr
                );
                await this.db.rollback();
                return;
            }

            const TXinfo = [
                trades[0].transaction_id,
                txid,
                trades[0].market_id,
                'pending',
                'pending',
                current_time,
                current_time,
            ];
            const [insertTransactionsErr, insertTransactionsResult] = await to(
                this.db.insert_transactions(TXinfo)
            );
            if (!insertTransactionsResult) {
                this.logger.log(
                    `[ADEX LAUCNER]:launch_update_trades failed %o`,
                    insertTransactionsErr
                );
                await this.db.rollback();
                return;
            }
            this.db.commit();
        } else {
            const errInfo = ['matched', null, current_time, trades[0].transaction_id];
            const [errUpdateErr] = await to(this.db.launch_update_trades(errInfo));
            this.logger.log(
                `[ADEX LAUNCHER] call dex matchorder err=${errUpdateErr}
                transaction_id=${trades[0].transaction_id}
                relayers=${this.relayer.address}`
            );
        }
        // 500ms的作用：1、为等待pg磁盘写入的时间，2、防止laucher过快，watcher跟不上，因为wathcer的需要链上确认
        return await this.sleep(500);
    }
}

LogUnhandled(Launcher.name);
const launcher = new Launcher();
launcher.start();
