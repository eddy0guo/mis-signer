// npm run build
// pm2 start pm2-mist.config.js --only mist --env production
// pm2 start pm2-mist.config.js --only mist-poa --env production
// pm2 start pm2-mist.config.js --env production

module.exports = {
  apps: [
  {
    name: "mist-poa",
    script: "./dist",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
  {
    name: "mist-poa-bot",
    script: "./dist/bot",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
  {
    name: "mist-poa-bot1",
    script: "./dist/bot",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
  {
    name: "mist-poa-bot2",
    script: "./dist/bot",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
  {
    name: "mist-poa-bot3",
    script: "./dist/bot",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },

  {
    name: "mist-poa-engine",
    script: "./dist/adex_engine",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },

  {
    name: "mist-poa-watcher",
    script: "./dist/adex_watcher",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },


  {
    name: "mist-poa-laucher",
    script: "./dist/adex_laucher",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
  {
    name: "mist-poa-express",
    script: "./dist/express_watcher",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
{
    name: "mist-poa-bridge",
    script: "./dist/bridge_watcher",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
    }
  },
  ]
}
