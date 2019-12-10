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
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_child_rpc;
		
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


	get_receipt_log(txid){
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_child_rpc;
		
		console.log("ssss---",cmd);
		let sto =  child.execSync(cmd)
		let logs = JSON.parse(sto).result.logs;
		if(!logs){
			console.error(`${cmd} result  have no logs`);
		}
    	console.log("log22222222222222222",logs.length,logs);//sto才是真正的输出，要不要打印到控制台，由你自己啊
		return logs.length > 0 ? 'successful':'failed';
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
----mint--"logs":[{"address":"0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c","topics":["0xce39aadd0e6aca7dcec6b4f53b1a15e20e545cad46a10664ad0af416cb0ac936"],"data":"0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000066202fab701a58b4b622ee07ac8ac11b872d727ced000000000000000000000066202fab701a58b4b622ee07ac8ac11b872d727ced0000000000000000000000000000000000000000000000000000000000989680","blockNumber":"0x1c1d7","transactionHash":"7f082454b220151a52f8b2241b0d47b6ac17ab6f13e47693d945b1de0744d028","transactionIndex":"0x2","blockHash":"dee5e73731f5396465117d0eaee83e0797160a8215c985b458ee72fecd087e0c","logIndex":"0x0","removed":false}]

--transfer--
logs":[{"address":"0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0x000000000000000000000066202fab701a58b4b622ee07ac8ac11b872d727ced","0x000000000000000000000066da67bf3462da51f083b5fed4662973a62701a687"],"data":"0x0000000000000000000000000000000000000000000000000000000000989680","blockNumber":"0x2f75f","transactionHash":"1794093892b16f6e141b69ab5289ed45b537098fe0bad3abf8d7e9ca32054618","transactionIndex":"0x2","blockHash":"63593807ccf41ce984d86a85b7ccfb475c29e43af2a8e9c423a82d44405e09ee","logIndex":"0x0","removed":false}]
*/
	async decode_erc20_transfer(txid){
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" ' + mist_config.asimov_child_rpc;
		console.log("cmd--------",cmd);
		let sto =  child.execSync(cmd)
        let logs = JSON.parse(sto).result.logs;
        if(logs){
            console.error(`${cmd} result  have no logs`);
       	} 
	   console.log("contractaddress-----data--------------",logs[0].address,logs[0].data)
	   let amount = parseInt(logs[0].data,16);
	   console.log("----------amount",amount)
		let info = {
				contract_address: logs[0].address,
				from: '0x' + logs[0].topics[1].substring(24), 
				to: '0x' + logs[0].topics[2].substring(24),
				amount: NP.divide(amount,100000000)
		};	

		console.log("erc--transferinfo=---------",info);
		return info;
	}


}
