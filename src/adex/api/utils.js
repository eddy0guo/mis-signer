const crypto = require('crypto');
var date = require("silly-datetime");
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;
var child = require('child_process');
const ethutil = require('ethereumjs-util')
const ethabi = require('ethereumjs-abi')

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
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"asimov_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" https:\/\/test-rpc.asimov.network';
		
		console.log("ssss---",cmd);
		let sto =  child.execSync(cmd)
		let logs = JSON.parse(sto).result.logs;
		let datas = [];
		for(var index in logs){
			datas.push(logs[index].data);	
		}
    	console.log("222222222222222",datas);//sto才是真正的输出，要不要打印到控制台，由你自己啊
		return datas;
	}

	async orderTobytes(order){
/*
        var order = {
            taker:"0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea",
            maker:"0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea",
            baseToken:"0x636062cabe31391dccd23eb7a43d3afc2b535f3f1e",
            quoteToken:"0x6330ddba6a9f84291d6e1aef688ca4461ec12c54e6",
            relayer:"0x668191f35bcc9d4c834e06bdbcb773609c40ba4cea",
            baseTokenAmount:"10",
            quoteTokenAmount:"10",
            takerSide:"buy"
        }
		
	 var order = {
            taker:"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
            maker:"0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
            baseToken:"0x639142ebdd7ecb2d35d946ef370e66557bc45e461c",
            quoteToken:"0x63d05a3e439066e4850fd7f8973dbb5820f00427cb",
            relayer:"0x66edd03c06441f8c2da19b90fcc42506dfa83226d3",
            baseTokenAmount:"6600000000",
            quoteTokenAmount:"300000000",
            takerSide:"sell"
        }*/



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
			console.error("abnormaled num");	
			result = false;
		}else if ( num * 10000 !=  Math.floor(num * 10000)){
			console.error("cannt support this decimal");	
			result = false;
		}else{}
		return result;
	}	
	
}
