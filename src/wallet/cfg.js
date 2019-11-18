let env = process.env.NODE_ENV
var cfg = {
	env: (env == 'development' ? 0 : 1), // 0测试  1正式
	RateDomain: 'http://webforex.hermes.hexun.com',
	chainRPC: process.env.ASIMOV_CHAIN_RPC,
	activeURL: '*',
	devnet: {
		rpc: process.env.ASIMOV_CHAIN_RPC,
	},

	testnet: {
		rpc: process.env.ASIMOV_CHAIN_RPC,
	}
}
if (env == 'production') {
	cfg.activeURL = 'app.flow.cm';

}

export default cfg
