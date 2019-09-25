import client from '../models/db'

export default class order{
    db;
    constructor() {
         this.db =  new client();
    }
    async build(marketID,amount,price) {

                let message = [marketID,amount,price];

                let result = this.db.insertorder(message);
                return result;
    }

    async cancle(walletInst) {
        return this.contract.callContract(abiInfo)
    }
 
}
