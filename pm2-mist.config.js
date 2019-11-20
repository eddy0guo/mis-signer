// npm run build
// pm2 start pm2-mist.config.js --only mist --env production
// pm2 start pm2-mist.config.js --only mist-poa --env production
// pm2 start pm2-mist.config.js --env production

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
  {
    name: "mist-bot",
    script: "./dist/bot",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "mist_test",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "postgres",
    }
  },
  {
    name: "mist",
    script: "./dist/ws",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "mist_test",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "postgres",
    }
  },
  {
    name: "mist-poa",
    script: "./dist",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "mist_test",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "mist_hqtn",
    }
  },
  {
    name: "mist-poa-bot",
    script: "./dist/bot",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "mist_test",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "mist_hqtn",
    }
  },
  {
    name: "mist-poa-ws",
    script: "./dist/ws",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "mist_test",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "mist_hqtn",
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