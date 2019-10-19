const crypto = require('crypto');
var date = require("silly-datetime");
const bitcore_lib_1 = require("bitcore-lib");
const ECDSA = bitcore_lib_1.crypto.ECDSA;

		var child = require('child_process');

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
//			let datas = this.get_receipt('90d6496675ad126e6ae77af19013a8d45ac23ebf9100e862c97e97a48af48441');
  //console.log("3333333333",datas);//sto才是真正的输出，要不要打印到控制台，由你自己啊
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
		let cmd = 'curl -X POST --data \'\{\"id\":1, \"jsonrpc\":\"2.0\",\"method\":\"flow_getTransactionReceipt\",\"params\":\[\"' + txid + '\"\]\}\}\' -H \"Content-type: application\/json\" https:\/\/test-rpc.asimov.network';
		console.log("ssss---",cmd);
		let sto =  child.execSync(cmd)
    	console.log("222222222222222i5555555",JSON.parse(sto));//sto才是真正的输出，要不要打印到控制台，由你自己啊
		let logs = JSON.parse(sto).result.logs;
		let datas = [];
		for(var index in logs){
			datas.push(logs[index].data);	
		}
    	console.log("222222222222222",sto);//sto才是真正的输出，要不要打印到控制台，由你自己啊
    	console.log("222222222222222",datas);//sto才是真正的输出，要不要打印到控制台，由你自己啊
		return datas;
	}

	sleep(numberMillis) {    
               var now = new Date();    
               var exitTime = now.getTime() + numberMillis;   
               while (true) { 
               now = new Date();       
               if (now.getTime() > exitTime) 
               return;    
               } 
	}
}
