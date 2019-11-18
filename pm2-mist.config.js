// pm2 start pm2-mist.config.js --only mist --env production

module.exports = {
  apps: [{
    name: "mist",
    script: "./dist",
    env: {
      NODE_ENV: "development",

      MIST_MODE: "mist_test",
      MIST_SERVER_PORT: 19300,
      ASIMOV_CHAIN_RPC: "https://test-rpc.asimov.network",
      ETH_EXPLORER_RPC: "http://119.23.215.121:8030",
      BTC_EXPLORER_RPC: "https://api.bitcore.io/api/BTC/testnet",
    },
    env_production: {
      NODE_ENV: "production",

      MIST_MODE: "postgres",
      ASIMOV_CHAIN_RPC: "https://test-rpc.asimov.network",
      MIST_SERVER_PORT: 18000,
      ETH_EXPLORER_RPC: "http://119.23.215.121:8030",
      BTC_EXPLORER_RPC: "https://api.bitcore.io/api/BTC/testnet",
    }
  },
    // {
    //   name: 'bot',
    //   script: './dist/bot'
    // },
    // {
    //   name: 'ws',
    //   script: './dist/ws'
    // }
  ]
}