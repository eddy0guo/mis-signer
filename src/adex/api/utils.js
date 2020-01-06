const crypto = require('crypto');
var date = require("silly-datetime");
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
var child = require('child_process');
const ethutil = require('ethereumjs-util')
const ethabi = require('ethereumjs-abi')
import NP from 'number-precision'
import mist_config from '../../cfg';

export default class utils {
    root_hash;

    constructor() {
        this.root_hash = crypto.createHmac('sha256', '123')
    }

    arr_values(message) {
        var arr_message = [];
        for (var item in message) {
            arr_message.push(message[item]);
        }

        return arr_message;
    }

    get_hash(message) {
        var create_time = this.get_current_time();
        let arr = this.arr_values(message);
        arr.push(create_time);
        let str = arr.join("");

        let root_hash = crypto.createHmac('sha256', '123')
        let hash = root_hash.update(str, 'utf8').digest('hex');
        return hash;

    }

    get_current_time() {
        let milli_seconds = new Date().getMilliseconds();
        var create_time = date.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        return create_time + '.' + milli_seconds;
    }

    verify(id, sign) {
        var hashbuf = Buffer.alloc(32, id, 'hex')
        var publick = new bitcore_lib_1.PublicKey(sign.pubkey);
        var sig = new bitcore_lib_1.crypto.Signature()
        var r = new bitcore_lib_1.crypto.BN(sign.r, 'hex')
        var s = new bitcore_lib_1.crypto.BN(sign.s, 'hex')
        sig.set({
            r: r,
            s: s
        })
        let result = ECDSA.verify(hashbuf, sig, publick);
        console.log('签名验证==', result)
        return result;
    }

    async get_receipt(txid) {
        let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_child_rpc;

        console.log("ssss---", cmd);
        let sto = child.execSync(cmd)
        let logs = JSON.parse(sto).result.logs;
        if (logs) {
            console.error(`${cmd} result  have no logs`);
        }
        let datas = [];
        for (var index in logs) {
            datas.push(logs[index].data);
        }
        return datas;
    }


    async get_receipt_log(txid) {
        let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_child_rpc;

        let sto = child.execSync(cmd)
        let logs = JSON.parse(sto).result.logs;
        if (!logs) {
            console.error(`${cmd} result  have no logs`);
        }
        return logs.length > 0 ? 'successful' : 'failed';
    }


    async orderTobytes(order) {

        order.taker = order.taker.substr(0, 2) + order.taker.substr(4, 44)
        order.maker = order.maker.substr(0, 2) + order.maker.substr(4, 44)
        order.baseToken = order.baseToken.substr(0, 2) + order.baseToken.substr(4, 44)
        order.quoteToken = order.quoteToken.substr(0, 2) + order.quoteToken.substr(4, 44)
        order.relayer = order.relayer.substr(0, 2) + order.relayer.substr(4, 44)
        order.takerSide = ethutil.keccak256(order.takerSide);

        var encode = ethabi.rawEncode(["bytes32", "address", "address", "address", "address", "address", "uint256", "uint256", "bytes32"],
            ["0x45eab75b1706cbb42c832fc66a1bcdaafebcdaea71ed2f08efbf3057c588fcb6",
                order.taker, order.maker, order.baseToken, order.quoteToken, order.relayer, order.baseTokenAmount, order.quoteTokenAmount, order.takerSide])

        encode = encode.toString('hex').replace(eval(`/00${order.taker.substr(2, 44)}/g`), `66${order.taker.substr(2, 44)}`)
        encode = encode.replace(eval(`/00${order.maker.substr(2, 44)}/g`), `66${order.maker.substr(2, 44)}`)
        encode = encode.replace(eval(`/00${order.baseToken.substr(2, 44)}/g`), `63${order.baseToken.substr(2, 44)}`)
        encode = encode.replace(eval(`/00${order.quoteToken.substr(2, 44)}/g`), `63${order.quoteToken.substr(2, 44)}`)
        encode = '0x' + encode.replace(eval(`/00${order.relayer.substr(2, 44)}/g`), `66${order.relayer.substr(2, 44)}`)

        return encode;
    }


    async orderhashbytes(order) {
        return new Promise((resolve, rejects) => {
            this.orderTobytes(order).then(res => {
                let reshash = ethutil.keccak256(res)
                let buf = Buffer.from("\x19\x01")
                let encode = ethabi.rawEncode(["bytes32", "bytes32"], ["0x1e026a98781f922f66258de623ab260b5d525da93b3fd8e9b845d83ae3c1711e", reshash])
                let endencode = '0x' + buf.toString('hex') + encode.toString('hex')
                let endhash = '0x' + ethutil.keccak256(endencode).toString('hex');
                resolve(endhash)
            })
        })
    }

    judge_legal_num(num) {
        let result = true;
        if (num <= 0) {
            result = false;
        } else if (NP.times(num, 10000) != Math.floor(NP.times(num, 10000))) {
            console.error("cannt support this decimal", num, NP.times(num, 10000), num * 10000);
            result = false;
        } else {
        }
        return result;
    }


    async decode_transfer_info(txid) {
        let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getRawTransaction\",\"params\":\[\"' + txid + '\",true,true\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_chain_rpc;

        let sto = child.execSync(cmd)
        let txinfo = JSON.parse(sto).result;
        let asset_set = new Set();
        for (let vin of txinfo.vin) {
            asset_set.add(vin.prevOut.asset);
        }

        //vins的所有address和assetid必须一致才去处理,且只考虑主网币做手续费这一种情况
        let vin_amount = 0;
        let from = txinfo.vin[0].prevOut.addresses[0];
        let asset_id;
        for (let vin of txinfo.vin) {
            if (vin.prevOut.addresses[0] != from) {
                throw new Error('decode failed,inputs contained Multiple addresses')
            } else if (vin.prevOut.asset == '000000000000000000000000' && asset_set.size > 1) {
                console.log("this is a fee utxo");
                continue;
            } else if (vin.prevOut.asset != '000000000000000000000000' && asset_set.size > 1 && asset_id != undefined && vin.prevOut.asset != asset_id) {
                throw new Error('decode failed,inputs contained Multiple asset')
            } else if (asset_id == undefined) {
                asset_id = vin.prevOut.asset;
                vin_amount += +vin.prevOut.value
            } else if ((asset_id != undefined && vin.prevOut.asset != '000000000000000000000000') || asset_set.size == 1) {
                vin_amount += +vin.prevOut.value
            } else {
                console.log("unknown case happened")
                throw new Error('decode failed')
            }
        }

        //vin里已经排除了多个asset的情况，vout就不判断了
        let vout_remain_amount = 0;
        let vout_to_amount = 0;
        let to_address;
        for (let out of txinfo.vout) {
            if (out.asset == '000000000000000000000000' && out.scriptPubKey.addresses[0] == from) {
                if (asset_set.size == 1) {
                    vout_remain_amount += out.value
                } else {
                    console.log("this is a fee out")
                }
            } else if (to_address != undefined && to_address != out.scriptPubKey.addresses[0] && from != out.scriptPubKey.addresses[0]) {
                throw new Error('decode failed,outputss contained Multiple addresses')
            } else if (out.scriptPubKey.addresses[0] == from) {
                vout_remain_amount += out.value
            } else if (to_address == undefined) {
                to_address = out.scriptPubKey.addresses[0];
                vout_to_amount += +out.value
            } else if (to_address != undefined && to_address == out.scriptPubKey.addresses[0]) {
                vout_to_amount += +out.value
            } else {
                throw new Error('decode failed')
            }
        }

        let transfer_info = {
            from: from,
            to: to_address,
            asset_id: txinfo.vout[0].asset,
            vin_amount: NP.divide(vin_amount, 100000000),
            to_amount: NP.divide(vout_to_amount, 100000000),
            remain_amount: NP.divide(vout_remain_amount, 100000000),
            fee_amount: NP.divide(txinfo.fee[0].value, 100000000),   //TODO: 兼容多个fee的情况
            fee_asset: txinfo.fee[0].asset
        };


        return transfer_info;
    }

    async decode_erc20_transfer(txid) {
        let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_child_rpc;
        let sto = child.execSync(cmd)
        let logs = JSON.parse(sto).result.logs;
        if (logs) {
            console.error(`${cmd} result  have no logs`);
        }
        let amount = parseInt(logs[0].data, 16);
        let info = {
            contract_address: logs[0].address,
            from: '0x' + logs[0].topics[1].substring(24),
            to: '0x' + logs[0].topics[2].substring(24),
            amount: NP.divide(amount, 100000000)
        };

        return info;
    }


}
