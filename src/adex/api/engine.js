
export default class engine{
        db;
        constructor(client) { 
               this.db = client;
        }
           

     async match(message) {
       let type =  "buy" 
       if (message[2] == "buy"){
            type = "sell"
       }

      let filter = [message[3],type]
        
       let result = this.db.filter_orders(filter); 

      
     }

     async call_asimov(message) {
       let type =  "buy" 
      

      // let filter = [message,type]
        
      // let result = this.db.listorders(filter); 

     }


}
