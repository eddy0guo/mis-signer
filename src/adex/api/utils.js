const crypto = require('crypto');
var date = require("silly-datetime");

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
			var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss');
			let arr = this.arr_values(message);
            arr.push(create_time);
            let str = arr.join("");
            let hash = this.root_hash.update(str, 'utf8').digest('hex'); 
			return hash;

    }

	get_current_time(){
			let milli_seconds = new Date().getMilliseconds();
			var create_time = date.format(new Date(),'YYYY-MM-DD HH:mm:ss');

			return create_time + '.' + milli_seconds;
	}
}
