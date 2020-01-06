import client from '../models/db'
import utils2 from '../api/utils'
import mist_wallet1 from '../api/mist_wallet'
import mist_config from '../../cfg'
import NP from 'number-precision'
import {AsimovWallet, Transaction, AsimovConst} from '@fingo/asimov-wallet';

export default class assets {
    db;
    exchange;
    root_hash;
    mist_wallet;
    times;

    constructor() {
        this.db = new client();
        this.utils = new utils2;
        this.mist_wallet = new mist_wallet1();
        this.times = 0;
    }

    async status_flushing() {
        this.loop();
    }

    async loop() {


        let update_time = this.utils.get_current_time();
        let token_arr = await this.mist_wallet.list_tokens();
        //asim的先不管
        token_arr.splice(1, 1);
        let assets_info = [];
        for (var i in token_arr) {
            if (token_arr[i].symbol != 'ASIM') {
                const wallet = new AsimovWallet({
                    name: 'test',
                    rpc: mist_config.asimov_master_rpc,
                    address: '0x66381fed979566a0656a3b422706072915a452ba6b'
                });
                let index = +token_arr[i].asim_assetid % 100000;

                let balance = await wallet.contractCall.callReadOnly(token_arr[i].asim_address, 'totalSupply(uint32)', [index])
                let total_balance = NP.divide(+balance, 100000000)
                console.log("balance------", balance)
                this.db.update_assets_total([total_balance, update_time, token_arr[i].symbol]);
                let asset_info = {
                    symbol: token_arr[i].symbol,
                    total: total_balance
                }
                assets_info.push(asset_info);
            }
        }

        //if(this.times == 24*60){
        if (this.times == 1 * 60) {
            for (let asset of assets_info)
                this.db.update_assets_yesterday_total([asset.total, update_time, asset.symbol]);
            this.times = 0;
        }

        this.times++;

        setTimeout(() => {
            this.loop.call(this)
            //间隔时间随着用户量的增长而降低
        }, 1000 * 60);

    }


}
