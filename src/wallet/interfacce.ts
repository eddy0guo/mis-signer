interface ListFingoConfig {
  dex_address: string
  express_address: string
  asimov_chain_rpc: string
  bridge_address: string
}

interface CoinAssetFeeConfig {
  token: string
  amount: number
}

export { ListFingoConfig, CoinAssetFeeConfig }