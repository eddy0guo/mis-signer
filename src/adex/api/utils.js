const crypto = require('crypto');
var date = require("silly-datetime");
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
var child = require('child_process');
const ethutil = require('ethereumjs-util')
const ethabi = require('ethereumjs-abi')
import NP from 'number-precision'
import mist_config from '../../cfg';

export default class utils{
	root_hash;
	 constructor() {
         this.root_hash = crypto.createHmac('sha256', '123')
    }

    arr_values(message){
        var arr_message = [];
       for(var item in message){
                    arr_message.push(message[item]);
       }

       return arr_message;
    }
	get_hash(message){
			var create_time = this.get_current_time();
			let arr = this.arr_values(message);
            arr.push(create_time);
            let str = arr.join("");

         let root_hash = crypto.createHmac('sha256', '123')
            let hash = root_hash.update(str, 'utf8').digest('hex'); 
			return hash;

    }

	get_current_time(){
			let milli_seconds = new Date().getMilliseconds();
			var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss');
			return create_time + '.' + milli_seconds;
	}
	verify(id,sign){
		console.log("11111111---",id,"666--",sign);
		  var hashbuf=Buffer.alloc(32,id,'hex')
		 var publick =new bitcore_lib_1.PublicKey(sign.pubkey);
		 var sig = new bitcore_lib_1.crypto.Signature()
		 var r=new bitcore_lib_1.crypto.BN(sign.r,'hex')
		 var s=new bitcore_lib_1.crypto.BN(sign.s,'hex')
		 sig.set({
			 r:r,
			 s:s
		 })
		 let result = ECDSA.verify(hashbuf,sig,publick);
		 console.log('签名验证==',result)	
			return result;
	}
	get_receipt(txid){
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_chain_rpc;
		
		console.log("ssss---",cmd);
		let sto =  child.execSync(cmd)
		let logs = JSON.parse(sto).result.logs;
		if(logs){
			console.error(`${cmd} result  have no logs`);
		}
		let datas = [];
		for(var index in logs){
			datas.push(logs[index].data);	
		}
    	console.log("222222222222222",datas);//sto才是真正的输出，要不要打印到控制台，由你自己啊
		return datas;
	}

	async orderTobytes(order){

        order.taker = order.taker.substr(0,2) + order.taker.substr(4,44)
        order.maker = order.maker.substr(0,2) + order.maker.substr(4,44)
        order.baseToken = order.baseToken.substr(0,2) + order.baseToken.substr(4,44)
        order.quoteToken = order.quoteToken.substr(0,2) + order.quoteToken.substr(4,44)
        order.relayer = order.relayer.substr(0,2) + order.relayer.substr(4,44)
        order.takerSide = ethutil.keccak256(order.takerSide);

        var encode = ethabi.rawEncode(["bytes32","address","address","address","address","address","uint256","uint256","bytes32"],
        ["0x45eab75b1706cbb42c832fc66a1bcdaafebcdaea71ed2f08efbf3057c588fcb6",
        order.taker,order.maker,order.baseToken,order.quoteToken,order.relayer,order.baseTokenAmount,order.quoteTokenAmount,order.takerSide])

        encode = encode.toString('hex').replace(eval(`/00${order.taker.substr(2,44)}/g`),`66${order.taker.substr(2,44)}`)
        encode = encode.replace(eval(`/00${order.maker.substr(2,44)}/g`),`66${order.maker.substr(2,44)}`)
        encode = encode.replace(eval(`/00${order.baseToken.substr(2,44)}/g`),`63${order.baseToken.substr(2,44)}`)
        encode = encode.replace(eval(`/00${order.quoteToken.substr(2,44)}/g`),`63${order.quoteToken.substr(2,44)}`)
        encode = '0x'+encode.replace(eval(`/00${order.relayer.substr(2,44)}/g`),`66${order.relayer.substr(2,44)}`)

 console.log("111111144444",encode);
       return encode;
    }


    async orderhashbytes(order){
 		console.log("111111144444",order);
        return new Promise((resolve,rejects) => {
            this.orderTobytes(order).then(res => {
                let reshash = ethutil.keccak256(res)
                let buf = Buffer.from("\x19\x01")
                let encode = ethabi.rawEncode(["bytes32","bytes32"],["0x1e026a98781f922f66258de623ab260b5d525da93b3fd8e9b845d83ae3c1711e",reshash])
                let endencode ='0x'+buf.toString('hex') + encode.toString('hex')
                let endhash = '0x' + ethutil.keccak256(endencode).toString('hex');
				console.log("1111333",endencode,endhash,res);
                resolve(endhash)
           })
        })
    }

	judge_legal_num(num){
		let result = true;
		if(num <= 0 ){	
			console.error("112233abnormaled num",num);	
			result = false;
		}else if (NP.times(num,10000) !=  Math.floor(NP.times(num,10000))){
			console.error("112233cannt support this decimal",num,NP.times(num,10000),num * 10000);	
			result = false;
		}else{}
		return result;
	}	


	async decode_transfer_info(txid){
		console.log("-------txid---",txid)
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getRawTransaction\",\"params\":\[\"' + txid + '\",true,true\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_chain_rpc;
		console.log("cmd--------------",cmd)

		let sto =  child.execSync(cmd)
        let txinfo = JSON.parse(sto).result;

		console.log("---------------%o\n",txinfo)
		//vins的所有address和assetid必须一致才去处理,且只考虑主网币做手续费这一种情况
		let vin_amount = 0;
		let from = txinfo.vin[0].prevOut.addresses[0];
		let asset_id;   
		for(let vin of txinfo.vin){
			console.log("--vinnnnnnn--",vin.prevOut.addresses[0])	
			if(vin.prevOut.addresses[0] != from){
			 throw new Error('decode failed,inputs contained Multiple addresses')
			}else if(vin.prevOut.asset == '000000000000000000000000'){
				console.log("this is a fee utxo");	
				continue;
			}else if(vin.prevOut.asset != '000000000000000000000000' &&  asset_id !=  undefined  && vin.prevOut.asset != asset_id){
				 throw new Error('decode failed,inputs contained Multiple asset')
			}else if(asset_id ==  undefined){
				 asset_id = vin.prevOut.asset;
				  vin_amount += +vin.prevOut.value
			}else if(asset_id != undefined && vin.prevOut.asset != '000000000000000000000000'){	
				vin_amount += +vin.prevOut.value	
			}else{
			console.log("unknown case happened")
			 throw new Error('decode failed')	
			}
		}

		//vin里已经排除了多个asset的情况，vout就不判断了
		let vout_remain_amount = 0;
		let vout_to_amount = 0;
		let to_address;
		for(let out of txinfo.vout){
			if(out.asset == '000000000000000000000000' ){
				console.log("this is a fee out")
				continue;
			}else if(  to_address !=  undefined && to_address != out.scriptPubKey.addresses[0] && from != out.scriptPubKey.addresses[0]){
			 	throw new Error('decode failed,outputss contained Multiple addresses')
			}else if(out.scriptPubKey.addresses[0] == from){
				vout_remain_amount += out.value	
			}else if( to_address == undefined ){
				to_address = out.scriptPubKey.addresses[0];
				console.log("78787778888-----",out.scriptPubKey.addresses[0])
				vout_to_amount += +out.value
			}else if(  to_address !=  undefined && to_address == out.scriptPubKey.addresses[0]){
				 vout_to_amount += +out.value
			}else{
			 	throw new Error('decode failed')
			}
		}

		let transfer_info = {
				from:from,
				to:to_address,
				asset_id: txinfo.vout[0].asset, 
				vin_amount: vin_amount,
				to_amount: vout_to_amount,
				remain_amount: vout_remain_amount,
				fee_amount: txinfo.fee[0].value,   //TODO: 兼容多个fee的情况
				fee_asset: txinfo.fee[0].asset
		};	

		console.log("111-----------",transfer_info);

		return transfer_info;	
	}
/*
	async decode_erc20_info(txid){
		txid = '3e27ed0bec51f1dad2e416dfaeba73206145b329f56bbae013da5af3e90b18f9';
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_chain_rpc;

		let brige_info = {
				type:
				from:
				to:
				amount:
		};	
		
		let sto =  child.execSync(cmd)
        let logs = JSON.parse(sto).result.logs;
        if(logs){
            console.error(`${cmd} result  have no logs`);
        }
		
	}
*/

}
