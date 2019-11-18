// npm run build
// pm2 start pm2-mist.config.js --only mist --env production

module.exports = {
  apps: [{
    name: "mist",
    script: "./dist",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "mist_test",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "postgres",
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