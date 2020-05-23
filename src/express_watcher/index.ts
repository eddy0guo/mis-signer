import to from 'await-to-js'
import Utils from '../adex/api/utils'
import DBClient from '../express/models/db'

import mist_config from '../cfg'
import {AsimovWallet} from '@fingo/asimov-wallet';
import {Health} from '../common/Health';
import NP from '../common/NP';
import {get_price} from '../express';
import Asset from '../wallet/contract/Asset';
import order1 from '../adex/api/order';
import mist_wallet1 from '../adex/api/mist_wallet';



class Watcher {

    private db;
    private utils;
    private order;
    private mist_wallet;

    constructor() {
        this.db = new DBClient();
        this.utils = new Utils();
        this.order = new order1(this.db);
        this.mist_wallet = new mist_wallet1(this.db);
    }

    async start() {
        this.quoteTXProcessLoop();
        this.baseTXDecodeLoop();
    }

    async baseTXDecodeLoop() {
        const [pendingDecodeErr, pendingDecode]: [any, any[]] = await to(this.db.getPendingDecodeBaseTX());
        if(!pendingDecode || pendingDecode.length === 0){
            console.log('[ADEX EXPRESS]::(decode_transfer_info):There are no trades to decode', pendingDecodeErr, pendingDecode);
            setTimeout(() => {
                this.baseTXDecodeLoop.call(this)
                // 间隔时间随着用户量的增长而降低
            }, 1000 * 10);
            return;
        }
        let quoteAssetName =  pendingDecode[0].quote_asset_name;
        const [decode_err, decode_info] = await to(this.utils.decode_transfer_info(pendingDecode[0].base_txid));
        let base_tx_status;

        if (decode_info) {
            base_tx_status = 'successful';
        } else {
            console.error('[ADEX EXPRESS]::(decode_transfer_info):', decode_err, decode_info);
            this.baseTXDecodeLoop.call(this);
            return;
        }

        const current_time = this.utils.get_current_time();
        const {from, to:toAddress, asset_id, vin_amount, to_amount, remain_amount} = decode_info;
        if (toAddress !== mist_config.express_address) {
            base_tx_status = 'illegaled';
            console.error(`reciver ${toAddress}  is not official address`);
        }

        const [base_token_err, base_token] = await to(this.db.get_tokens([asset_id]));
        if (base_token_err || !base_token || base_token.length === 0) {
            console.error(`[ADEX EXPRESS]::(get_tokens):asset ${asset_id}  is not support`);
            this.baseTXDecodeLoop.call(this);
            return;
        }
        // tslint:disable-next-line:prefer-const
        let [err, price] = await to(get_price(base_token[0].symbol, quoteAssetName, to_amount, this.order));
        if (!price){
            base_tx_status = 'illegaled';
            console.error('[ADEX EXPRESS]::get zero price or error', err,price);
        }
        let quote_amount = NP.times(to_amount, Number(price), 0.995);
        let fee_amount = NP.times(to_amount, Number(price), 0.005);
        const asset = new Asset(mist_config.asimov_master_rpc);
        const [balancesErr, balances] = await to(asset.get_asset_balances(this.mist_wallet, mist_config.express_address, quoteAssetName));
        if(!balances){
            console.error(`[ADEX EXPRESS]::(get_price):'' ${balancesErr}`);
            this.baseTXDecodeLoop.call(this);
            return;
        } else if (quote_amount > balances[0].asim_asset_balance) {
            console.error(`The express account only have ${balances[0].asim_asset_balance}  ${quoteAssetName}`);
            console.log(`Start refunding users' ${base_token[0].symbol}`);
            price = '1';
            quote_amount = to_amount;
            fee_amount = 0;
            quoteAssetName = base_token[0].symbol;
            // tslint:disable-next-line:no-empty
        }else{
        }
        const info = {
            address: from,
            base_asset_name: base_token[0].symbol,
            base_amount: to_amount,
            price,
            quote_token_name: quoteAssetName,
            quote_amount,
            fee_amount,
            base_tx_status,
            quote_tx_status: 'pending',
            updated_at: current_time,
            trade_id: pendingDecode[0].trade_id,
        };
        const info_arr = this.utils.arr_values(info);
        const [updateBaseErr, updateBaseRes] = await to(this.db.update_base(info_arr));
        if (!updateBaseRes) console.error(updateBaseErr, updateBaseRes);
        this.baseTXDecodeLoop.call(this);
    }

    async quoteTXProcessLoop() {

        const [err, pendingTrade]: [any, any] = await to(this.db.laucher_pending_trade());
        if (!pendingTrade) {

            console.log(`[Express Watcher]pendingTrade=${pendingTrade},error=${err}`);
            setTimeout(() => {
                this.quoteTXProcessLoop.call(this)
            }, 2000);

            return;
        }

        if (pendingTrade.length <= 0) {

            console.log('[Express Watcher]No pending trade');
            setTimeout(() => {
                this.quoteTXProcessLoop.call(this)
            }, 2000);

            return;
        }
        const {trade_id, address, quote_amount, quote_asset_name} = pendingTrade[0];
        const current_time = this.utils.get_current_time();

        const [tokens_err, tokens] = await to(this.db.get_tokens([quote_asset_name]));
        if (!tokens) {
            console.error('[Express Watcher] Token Err:', tokens_err, tokens);
            setTimeout(() => {
                this.quoteTXProcessLoop.call(this)
            }, 2000);
            return;
        }

        const wallet = new AsimovWallet({
            name: mist_config.express_address,
            rpc: mist_config.asimov_master_rpc,
            mnemonic: mist_config.express_word,
        });
        const [quote_err, quote_txid] = await to(wallet.commonTX.transfer(address, quote_amount, tokens[0].asim_assetid));
        if (!quote_txid) {
            console.error('[Express Watcher] quote_err:', quote_err, quote_txid)
            setTimeout(() => {
                this.quoteTXProcessLoop.call(this)
            }, 2000);
            return;
        }

        const quote_tx_status = !quote_txid ? 'failed' : 'successful';

        const info = [quote_txid, quote_tx_status, current_time, trade_id];

        const [err3, result3] = await to(this.db.update_quote(info));
        if (!result3) console.error('[Express Watcher] update_quote Error:', err3, result3)
        await this.utils.requestCacheTXid(quote_txid);
        setTimeout(() => {
            this.quoteTXProcessLoop.call(this)
            // 间隔时间随着用户量的增长而降低
        }, 1000 * 10);


    }

}

process.on('unhandledRejection', (reason, p) => {
    console.log('[Express Watcher]Unhandled Rejection at: Promise reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

const health = new Health();
health.start();

const watcher = new Watcher();
watcher.start();
