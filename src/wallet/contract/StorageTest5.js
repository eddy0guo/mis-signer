
import Contract from './Contract'

export default class StorageTest {
    contractAddress = '0x63440cf52da6faddc17e33ed4e823e9aa20ce4ca4c'
    // 对应 protocol demo下的Storage合约
    contract;

    constructor() {
        this.contract = new Contract(this.contractAddress)
    }

    async testInsert(walletInst) {
        
        let abiInfo = {
            "constant": false,
            "inputs":  [{"components":[{"name":"text","type":"string"},{"name":"ttt","type":"uint256"},{"name":"aaa","type":"string"}],
            "name": "recordData",
            "type": "tuple",
            "value": ["aaaa",22,"ssss"]
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
        this.contract.unlock(walletInst, "111111")
        return this.contract.callContract(abiInfo)
    }

}
