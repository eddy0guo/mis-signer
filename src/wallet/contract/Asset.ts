import {AsimovWallet} from '@fingo/asimov-wallet';
import mist_config from '../../cfg';
import utils2 from '../../adex/api/utils';
import {address} from 'bitcoinjs-lib';

// 直接用AsimovWallet获得余额也可以
export default class Asset {

    private readonly rpc;

    constructor(rpc: string) {
        this.rpc = rpc;
    }

    // tslint:disable-next-line:no-shadowed-variable
    public async balanceOf(address: string): Promise<any> {
        const wallet = new AsimovWallet({
            rpc: this.rpc,
            address,
        });
        return wallet.balance()
    }

}
