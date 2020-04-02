import {AsimovWallet} from '@fingo/asimov-wallet';
import crypto = require('crypto');
import date = require('silly-datetime');
import ethutil = require('ethereumjs-util');
import ethabi = require('ethereumjs-abi');


import abi = require('@asimovdev/asimovjs/lib/utils/AbiCoder');
import bitcore_lib_1 = require('bitcore-lib');

const ECDSA = bitcore_lib_1.crypto.ECDSA;
const HASH = bitcore_lib_1.crypto.Hash;


import NP from '../../common/NP';
import to from 'await-to-js'

import Config from '../../cfg';

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

    get_current_time(): string {
        const milli_seconds = new Date().getMilliseconds();
        const create_time = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        return create_time + '.' + milli_seconds;
    }

    verify(id, sign): boolean {
        const Bitcore = this.bitcore;
        const hashbuf = Buffer.alloc(32, id, 'hex');
        const publick = new Bitcore.PublicKey(sign.pubkey);
        const sig = new Bitcore.crypto.Signature();
        const r = new Bitcore.crypto.BN(sign.r, 'hex');
        const s = new Bitcore.crypto.BN(sign.s, 'hex');
        sig.set({
            r,
            s,
        });
        const result = Bitcore.crypto.ECDSA.verify(hashbuf, sig, publick);
        return result;
    }

    verify2(address: string, amount: number, price: number, time: number, market_id: string,
            side: string, sign: string, publicKey: string) {
        const bitcore_lib_2 = require('bitcore-lib');
        const orderArr = [address, amount, price, time, market_id, side];
        const orderhash = this.orderHash(orderArr);

        /*
         const Address = require('bitcore-lib/lib/address');
         if(sign.length !== 132){
            // throw new Error('signature length is invalid')
            return [false,null];
        }
         const addressFromPubKey = '0x66' + Address.fromPublicKey(publicKey, 'livenet').hashBuffer.toString('hex');
         if(addressFromPubKey !== address){
             console.log('%o(address)  does not equal %o(addressFromPubKey)',address,addressFromPubKey);
             return [false,null];
         }



         const pubkey =  new bitcore_lib_1.PublicKey(publicKey);
         const  hashbuf = Buffer.from(orderhash, 'hex');
         let r = sign.slice(2,66);
         let s = sign.slice(66,130);
         const bitcore_sign = new bitcore_lib_2.crypto.Signature();
         r = new bitcore_lib_2.crypto.BN(r, 'hex');
         s = new bitcore_lib_2.crypto.BN(s, 'hex');
         bitcore_sign.set({r,s});
         const bl = ECDSA.verify(hashbuf, bitcore_sign, pubkey);
         return [bl,orderhash];
            */
        const secp256k1 = require('secp256k1');
        const Address = require('bitcore-lib/lib/address');
        const hashbuf = Buffer.from(orderhash, 'hex');
        const rands = sign.slice(2, 130);
        let r = sign.slice(2, 66);
        let s = sign.slice(66, 130);
        const btc_sign = new bitcore_lib_2.crypto.Signature();
        r = new bitcore_lib_2.crypto.BN(r, 'hex');
        s = new bitcore_lib_2.crypto.BN(s, 'hex');
        btc_sign.set({r, s});

        const hashbuf_uint8 = new Uint8Array(hashbuf);
        const rands_uint8 = new Uint8Array(Buffer.from(rands, 'hex'));
        for (let i = 0; i < 2; i++) {
            let publick = secp256k1.ecdsaRecover(rands_uint8, i, hashbuf_uint8);
            publick = new bitcore_lib_1.PublicKey(publick);
            const recoverAddress = '0x66' + Address.fromPublicKey(publick, 'livenet').hashBuffer.toString('hex');
            if (address === recoverAddress) {
                return [true, orderhash];
            }
        }
        return [false, null];
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

        return result.logs.length > 0 ? 'successful' : 'failed';
    }

    async orderTobytes(order): Promise<string> {
        order.taker = order.taker.substr(0, 2) + order.taker.substr(4, 44);
        order.maker = order.maker.substr(0, 2) + order.maker.substr(4, 44);
        order.baseToken = order.baseToken.substr(0, 2) + order.baseToken.substr(4, 44);
        order.quoteToken = order.quoteToken.substr(0, 2) + order.quoteToken.substr(4, 44);
        order.relayer = order.relayer.substr(0, 2) + order.relayer.substr(4, 44);
        order.takerSide = ethutil.keccak256(order.takerSide);

        let encode = ethabi.rawEncode(['bytes32', 'address', 'address', 'address', 'address', 'address', 'uint256', 'uint256', 'bytes32'],
            ['0x45eab75b1706cbb42c832fc66a1bcdaafebcdaea71ed2f08efbf3057c588fcb6',
                order.taker, order.maker, order.baseToken, order.quoteToken, order.relayer, order.baseTokenAmount, order.quoteTokenAmount, order.takerSide]);

        encode = encode.toString('hex').replace(new RegExp(`00${order.taker.substr(2, 44)}`, 'g'), `66${order.taker.substr(2, 44)}`);
        encode = encode.replace(new RegExp(`00${order.maker.substr(2, 44)}`, 'g'), `66${order.maker.substr(2, 44)}`);
        encode = encode.replace(new RegExp(`00${order.baseToken.substr(2, 44)}`, 'g'), `63${order.baseToken.substr(2, 44)}`);
        encode = encode.replace(new RegExp(`00${order.quoteToken.substr(2, 44)}`, 'g'), `63${order.quoteToken.substr(2, 44)}`);
        encode = '0x' + encode.replace(new RegExp(`00${order.relayer.substr(2, 44)}`, 'g'), `66${order.relayer.substr(2, 44)}`);
        /*
        encode = encode.toString('hex').replace(eval(`/00${order.taker.substr(2, 44)}/g`), `66${order.taker.substr(2, 44)}`);
        encode = encode.replace(eval(`/00${order.maker.substr(2, 44)}/g`), `66${order.maker.substr(2, 44)}`);
        encode = encode.replace(eval(`/00${order.baseToken.substr(2, 44)}/g`), `63${order.baseToken.substr(2, 44)}`);
        encode = encode.replace(eval(`/00${order.quoteToken.substr(2, 44)}/g`), `63${order.quoteToken.substr(2, 44)}`);
        encode = '0x' + encode.replace(eval(`/00${order.relayer.substr(2, 44)}/g`), `66${order.relayer.substr(2, 44)}`);
        */

        return encode;
    }

    async orderHashBytes(order): Promise<string> {
        return new Promise((resolve, rejects) => {
            this.orderTobytes(order).then(res => {
                const reshash = ethutil.keccak256(res);
                const buf = Buffer.from('\x19\x01');
                const encode = ethabi.rawEncode(['bytes32', 'bytes32'], ['0x1e026a98781f922f66258de623ab260b5d525da93b3fd8e9b845d83ae3c1711e', reshash]);
                const endencode = '0x' + buf.toString('hex') + encode.toString('hex');
                const endhash = '0x' + ethutil.keccak256(endencode).toString('hex');
                resolve(endhash);
            }).catch(e => {
                rejects(e);
            });
        });
    }

    judge_legal_num(num): boolean {
        let result = true;
        if (num <= 0) {
            result = false;
        } else if (NP.times(num, 10000) !== Math.floor(NP.times(num, 10000))) {
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

    async decode_erc20_transfer(txid): Promise<any> {
        const [err, result] = await to(this.child.rpc.request('asimov_getTransactionReceipt', [txid]));
        if (err || !result || !result.logs) {
            console.error(`err ${err} occurred or get ${txid} receipt  have no logs`);
        }
        const amount = parseInt(result.logs[0].data, 16);
        const info = {
            contract_address: result.logs[0].address,
            from: '0x' + result.logs[0].topics[1].substring(24),
            to: '0x' + result.logs[0].topics[2].substring(24),
            amount: NP.divide(amount, 100000000),
        };

        return info;
    }

}
