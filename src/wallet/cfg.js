let env = process.env.NODE_ENV
var cfg = {
	env: (env == 'development' ? 0 : 1), // 0测试  1正式
	RateDomain: 'http://webforex.hermes.hexun.com',
	chainRPC: 'https://test-rpc.asimov.network',
	activeURL: '*',
	devnet: {
		rpc: 'https://test-rpc.asimov.network'
	},

	testnet: {
		rpc: 'https://test-rpc.asimov.network'
	}
}
if (env == 'production') {
	cfg.activeURL = 'app.flow.cm';

}

export default cfg