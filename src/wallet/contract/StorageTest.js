
import Contract from './Contract'

export default class StorageTest {
    contractAddress = '0x63753a6fd72f0006a60755a8c49fd8e8480b62efb3'
    // 对应 protocol demo下的Storage合约
    contract;

    constructor() {
        this.contract = new Contract(this.contractAddress)
    }

    async testInsert(walletInst) {
        


    
    let abiInfo = {"constant":false,"inputs":[{"name":"x","type":"string","value":"kkkkkkk"}],"name":"set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"};


        this.contract.unlock(walletInst, "111111")
        return this.contract.callContract(abiInfo)
    }

}
