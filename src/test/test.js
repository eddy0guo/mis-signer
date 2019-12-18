import { AsimovWallet, AsimovConst } from 'asimov-wallet'
export default async()=>{
	let wallet = new AsimovWallet({
        name: 'test',
        rpc:'https://rpc-master.mistabit.com',
        mnemonic:'cannon club beach denial swear fantasy donate bag fiscal arrive hole reopen',
        // storage: 'localforage',
    })
     
    await wallet.account.createAccount()
    let address = wallet.address
    let pk = wallet.pk
    let mnemonic = wallet.config.mnemonic
     
    let balance = await wallet.account.balance()
     
    let res = await wallet.commonTX.transfer('0x666234b6348c10fed282b95c1f1768aa3113eb96b2',1,AsimovConst.DEFAULT_ASSET_ID)

    console.log(address,pk,mnemonic,balance,res)
}
