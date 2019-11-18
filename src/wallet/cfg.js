import mist_config from '../cfg'
let env = process.env.NODE_ENV
var cfg = {
	env: (env == 'development' ? 0 : 1), // 0测试  1正式
	RateDomain: 'http://webforex.hermes.hexun.com',
	chainRPC: mist_config.asimov_chain_rpc,
	activeURL: '*',
	devnet: {
		rpc: mist_config.asimov_chain_rpc,
	},

	testnet: {
		rpc: mist_config.asimov_chain_rpc,
	}
}
if (env == 'production') {
	cfg.activeURL = 'app.flow.cm';

}

export default cfg
