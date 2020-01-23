import helper from '../lib/txHelper'
import { chain } from '../api/chain'
import { TranService } from '../service/transaction';
import { CONSTANT } from '../constant';
import { btc2sts, isArrayType, callParamsConvert } from '../utils';

export default class Contract {
    fee = 0.05
    gasLimit = 10000000
    address
    wallet
    password

    constructor(address,abiStr='') {
        this.address = address
        this.adiStr = abiStr
    }

    /**
     * unlock once
     * @param {*} wallet
     * @param {*} password
     */
    unlock(wallet, password) {
        this.wallet = wallet
        this.password = password
    }
    /**
     * Call Contract Function with abi Info
     * 除了充值合约，主币的amount应该都是0，扣fee会自动计算。
     *
     * @param {*} abiInfo
     * @param {*} wallet
     */
    async callContract(abiInfo) {
        const params = {
            to: this.address,
            amount: 0,
            assetId: CONSTANT.DEFAULT_ASSET,
            data: this.getHexData(abiInfo)
        };

        console.log('params.data:',params.data)

        if (abiInfo.stateMutability == 'view' || abiInfo.stateMutability == 'pure') {
            return chain.callreadonlyfunction([this.address, this.address, params.data, abiInfo.name, this.abiStr])
        } else {
            params.from = await this.wallet.getAddress()
            params.type = CONSTANT.CONTRACT_TYPE.CALL
            return this.executeContract(params)
        }
    }

    /**
     * Execute Contract Function，Wallet需要在执行Contract前更新UTXO，确保缓存正确可以执行成功
     * await wallet.queryAllBalance()
     *
     * @param {*} params
     */
    async executeContract(params) {
        const wallet = this.wallet;
        const password = this.password;

	        const assetObjArr = [];

        assetObjArr.push({
        amount: params.amount,
        asset: params.assetId
      });

      assetObjArr.push({
        amount: 0.02,
        asset: '000000000000000000000000'
      });

      const { ins, changeOut } = await TranService.chooseUTXO(
        wallet.walletId,
        assetObjArr,
        params.from
      );

        let outs = [{
            amount: btc2sts(parseFloat(params.amount)),
            assets: params.assetId,
            address: params.to,
            data: params.data || '',
            contractType: params.type || ''
        }];

        if (changeOut && changeOut.length) {
            outs = outs.concat(changeOut);
        }

        const keys = await wallet.getPrivateKeys(
            CONSTANT.DEFAULT_COIN.coinType,
            ins,
            password
        );

        try {
            const rawtx = TranService.generateRawTx(ins, outs, keys, this.gasLimit);

            console.log('RAWTX:',rawtx)

            if (!rawtx) {
                console.log('executeContract Raw TX Error')
                return;
            }

            console.log('executeContract Success:', params, ins, outs);
            return chain.sendrawtransaction([rawtx]);
        } catch (e) {
            console.log('executeContract TX Error', e)
        }
    }

    /**
     * Generate ABI Hex Data
     * @param {*} abiInfo
     */
    getHexData(abiInfo) {
        if (!abiInfo) return
        if (!abiInfo.inputs) return

        const funcArgs = []

        abiInfo.inputs.forEach(i => {
            if (isArrayType(i.type)) {
                const arr = JSON.parse(i.value);
                const type = i.type.replace('[]', '');
                const result = []
                arr.forEach(a => {
                    result.push(callParamsConvert(type, a))
                });
                funcArgs.push(result);
            } else {
                funcArgs.push(callParamsConvert(i.type, i.value))
            }
        })

        let functionHash, paramsHash = ''

        try {
            functionHash = helper.encodeFunctionId(abiInfo);
        } catch (e) {
            console.log('getHexData encodeFunctionId Error:', e, abiInfo);
            return;
        }

        try {
            paramsHash = helper.encodeParams(abiInfo, funcArgs).toString('hex');
        } catch (e) {
            console.log('getHexData encodeParams Error', e, abiInfo, funcArgs);
            return;
        }

        const data = functionHash.replace('0x', '') + paramsHash.replace('0x', '');
        return data;
    }


}
