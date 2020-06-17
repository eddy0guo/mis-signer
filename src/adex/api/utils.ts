import {AsimovWallet} from '@fingo/asimov-wallet';
import crypto = require('crypto');
import date = require('silly-datetime');
import ethutil = require('ethereumjs-util');
import ethabi = require('ethereumjs-abi');
import abi = require('@asimovdev/asimovjs/lib/utils/AbiCoder');
import * as bitcore_lib_1 from 'bitcore-lib';
// tslint:disable-next-line:no-var-requires
const Address = require('bitcore-lib/lib/address');
const ECDSA = bitcore_lib_1.crypto.ECDSA;
const HASH = bitcore_lib_1.crypto.Hash;
import axios from 'axios';
import * as secp256k1 from 'secp256k1'




import NP from '../../common/NP';
import to from 'await-to-js'

import Config from '../../cfg';
import {Networks} from 'bitcore-lib';
import add = Networks.add;

export default class Utils {
    private bitcore;
    private master: AsimovWallet;
    private child: AsimovWallet;

    constructor() {
        this.bitcore = require('bitcore-lib');

        this.master = new AsimovWallet({
            name: Config.bridge_address,
            address: Config.bridge_address,
            rpc: Config.asimov_master_rpc,
        });

        this.child = new AsimovWallet({
            name: Config.bridge_address,
            address: Config.bridge_address,
            rpc: Config.asimov_child_rpc,
        });
    }

    arr_values(message): any[] {
        const arr_message = [];
        for (const item of Object.keys(message)) {
            arr_message.push(message[item]);
        }

        return arr_message;
    }

    get_hash(message): string {
        const createTime = this.get_current_time();
        const arr = this.arr_values(message);
        arr.push(createTime);
        const str = arr.join('');

        const rootHash = crypto.createHmac('sha256', '123');
        const hash = rootHash.update(str, 'utf8').digest('hex');
        return hash;

    }

    orderHash(order) {
        let str = abi.defaultAbiCoder.encode(['address', 'uint256', 'uint256', 'uint256', 'string', 'string'], order)
        str = str.slice(2, str.length)
        const hash = HASH.sha256(Buffer.from(str, 'hex')).toString('hex');
        return hash;
    }
    approveHash(){
        /**
         *
         *     let str = abi.defaultAbiCoder.encode(["string"],["Fingo DEX"])
         str = str.slice(2,str.length)
         let hash = HASH.sha256(Buffer.from(str,'hex')).toString('hex');
         *
         * **/
        let str = abi.defaultAbiCoder.encode(['string'],['Fingo DEX']);
        str = str.slice(2, str.length)
        const hash = HASH.sha256(Buffer.from(str, 'hex')).toString('hex');
        return hash;
    }
    tmp_sign(privateKey, order_id) {
        const  hashbuf = Buffer.from(order_id, 'hex')
        const  hashbuf_uint8 = new Uint8Array(Buffer.from(privateKey,'hex'))
        const  sig= secp256k1.ecdsaSign(hashbuf,hashbuf_uint8)
        const recovery = sig.recid +27
        return  '0x'+(Buffer.from(sig.signature).toString('hex')+recovery.toString(16))
    }

    get_current_time(): string {
        const milli_seconds = new Date().getMilliseconds();
        const create_time = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        return create_time + '.' + milli_seconds;
    }
    async verify2(address:string,orderhash: string,sign: string, publicKey: string) {
        const bitcore_lib_2 = require('bitcore-lib');
        if(sign.length !== 132){
            throw new Error('signature length is invalid')
        }
        // @ts-ignore
        const publick =  new bitcore_lib_1.PublicKey(Buffer.from(publicKey,'hex'));
        const recoverAddress = '0x66' + Address.fromPublicKey(publick, 'livenet').hashBuffer.toString('hex');
        if(address !== recoverAddress){
            throw new Error('The order address does not match the user');
        }
        const pubKeyObj =  new bitcore_lib_1.PublicKey(publicKey);
        const  hashbuf = Buffer.from(orderhash, 'hex');
        let r = sign.slice(2,66);
        let s = sign.slice(66,130);
        const bitcore_sign = new bitcore_lib_2.crypto.Signature();
        r = new bitcore_lib_2.crypto.BN(r, 'hex');
        s = new bitcore_lib_2.crypto.BN(s, 'hex');
        bitcore_sign.set({r, s,});
        return  ECDSA.verify(hashbuf, bitcore_sign, pubKeyObj)
    }

    async get_receipt_log(txid) {
        const [err, result] = await to(this.child.rpc.request('asimov_getTransactionReceipt', [txid]));
        if (!result) {
            console.error(`(get_receipt_log):: err ${err} occurred or get ${txid} receipt`);
            throw new Error(`${txid} get_receipt_log failed,rpc error ${err}`);
        }

        if (!result.logs) {
            console.error(`(get_receipt_log):: ${txid}  have no receipt logs`);
            throw new Error(`${txid} get_receipt_log failed,transaction haven't confirmed yet`);
        }

        return result.logs;
    }
    judge_legal_num(num): boolean {
        let result = true;
        if (num <= 0) {
            result = false;
        } else if (+NP.times(num, 10000) !== Math.floor(+NP.times(num, 10000))){
            console.error('cannt support this decimal', num, NP.times(num, 10000), num * 10000);
            result = false;
        }
        return result;
    }

    /**
     * Decode TX @ Master Chain
     * @param txid:string
     */
    async decode_transfer_info(txid: string): Promise<any> {
        const [err, txinfo] = await to(this.master.commonTX.detail(txid));
        if (err || !txinfo) {
            console.log('[UTILS] asimov_getRawTransaction failed', err);
            console.log('[UTILS] TXID:', txid);
            throw new Error('asimov_getRawTransaction failed');
        }

        const asset_set = new Set();
        for (const vin of txinfo.vin) {
            asset_set.add(vin.prevOut.asset);
        }

        // vins的所有address和assetid必须一致才去处理,且只考虑主网币做手续费这一种情况
        let vin_amount = 0;
        const from = txinfo.vin[0].prevOut.addresses[0];
        let asset_id;
        for (const vin of txinfo.vin) {
            if (vin.prevOut.addresses[0] !== from) {
                throw new Error('decode failed,inputs contained Multiple addresses');
            } else if (vin.prevOut.asset === '000000000000000000000000' && asset_set.size > 1) {
                console.log('this is a fee utxo');
                continue;
            } else if (vin.prevOut.asset !== '000000000000000000000000' && asset_set.size > 1 && asset_id && vin.prevOut.asset !== asset_id) {
                throw new Error('decode failed,inputs contained Multiple asset');
            } else if (!asset_id) {
                asset_id = vin.prevOut.asset;
                vin_amount += +vin.prevOut.value;
            } else if ((asset_id && vin.prevOut.asset !== '000000000000000000000000') || asset_set.size === 1) {
                vin_amount += +vin.prevOut.value;
            } else {
                console.log('unknown case happened');
                throw new Error('decode failed');
            }
        }

        // vin里已经排除了多个asset的情况，vout就不判断了
        let vout_remain_amount = 0;
        let vout_to_amount = 0;
        let to_address;
        for (const out of txinfo.vout) {
            if (out.asset === '000000000000000000000000' && out.scriptPubKey.addresses[0] === from) {
                if (asset_set.size === 1) {
                    vout_remain_amount += out.value;
                } else {
                    console.log('this is a fee out');
                }
            } else if (to_address && to_address !== out.scriptPubKey.addresses[0] && from !== out.scriptPubKey.addresses[0]) {
                throw new Error('decode failed,outputss contained Multiple addresses');
            } else if (out.scriptPubKey.addresses[0] === from) {
                vout_remain_amount += out.value;
            } else if (!to_address) {
                to_address = out.scriptPubKey.addresses[0];
                vout_to_amount += +out.value;
            } else if (to_address && to_address === out.scriptPubKey.addresses[0]) {
                vout_to_amount += +out.value;
            } else {
                throw new Error('decode failed');
            }
        }

        const transfer_info = {
            from,
            to: to_address,
            asset_id: txinfo.vout[0].asset,
            vin_amount: NP.divide(vin_amount, 100000000),
            to_amount: NP.divide(vout_to_amount, 100000000),
            remain_amount: NP.divide(vout_remain_amount, 100000000),
            fee_amount: NP.divide(txinfo.fee[0].value, 100000000),   // TODO: 兼容多个fee的情况
            fee_asset: txinfo.fee[0].asset,
        };

        return transfer_info;
    }

    async requestCacheTXid(txid:string): Promise<void>{
        const content = txid + '_asimov';
        const result = crypto.createHash('md5').update(content).digest('hex');
        const param = {
            txid,
            sign: result
        }
        const [err, res] = await to(
            axios.post('https://fingoapp.com/_api/wal/public/after/broadcast', param, {
                timeout: 10 * 1000,
            })
        );
        console.log('requestCacheTXid',param,err,res.data);
        if (res.data.code !== 0){
            console.error('requestCacheTXid failed',txid);
        }
    }

    static bookKeyFromAddress(address): string{
        return process.env.MIST_MODE + '::' + address;
    }

    static async sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
}
