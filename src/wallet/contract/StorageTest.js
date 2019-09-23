
import Contract from './Contract'

export default class StorageTest {
    contractAddress = '0x63a4ae5490aac5aa130f993e86f5357547f9c647ea'
    // 对应 protocol demo下的Storage合约
    contract;

    constructor(){
        this.contract = new Contract(this.contractAddress)
    }

    async testInsert() {
        let abiInfo = {
        "constant": false,
        "inputs": [{
            "components": [{
            "name": "text",
            "type": "string"
            }],
            "name": "recordData",
            "type": "tuple"
        }],
        "name": "Insert",
        "outputs": [{
            "name": "success",
            "type": "bool"
        }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
        }
        
      return this.contract.callContract(abiInfo)
    }
  
  }