import BTCBridge from './BTCBridge'
import User from '../models/user'

// User.find({}).then((err,users)=>{
// 	console.log(err,users)
// 	for(let i in users){
// 		let user = users[i]
// 		let btcBridge = new BTCBridge(
// 			user.asim_address,
// 			user.btc_address)
// 		btcBridge.start(i*1000)
// 	}
// })

let btcBridge = new BTCBridge(
	'0x66b1c6ffb579e61f8de5e7f5a9c29ddc560c7a10cd',
	'mw3fFTAQ7GXT5XcFkrrfR2GZgrFmPPZ5Yw')
btcBridge.start()

export default btcBridge;
