// npm run build
// pm2 start pm2-mist.config.js --only mist --env production
// pm2 start pm2-mist.config.js --only mist-poa --env production
// pm2 start pm2-mist.config.js --env production

module.exports = {
  apps: [
  {
    name: "mist-poa-ts",
    script: "./dist",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
	  REDIS_URL:"119.23.215.121",
      REDIS_PORT:6379,
      REDIS_PWD:"LPJQoIcvl0",
	  WS_REDIS_URL:"119.23.215.121",
      WS_REDIS_PORT:6379,
      WS_REDIS_PWD:"LPJQoIcvl0",

    }
  },
  {
    name: "mist-poa-engine-ts",
    script: "./dist/adex_engine",
    env: {
      NODE_ENV: "development",
      MIST_MODE: "local",
    },
    env_production: {
      NODE_ENV: "production",
      MIST_MODE: "product",
	  REDIS_URL:"119.23.215.121",
      REDIS_PORT:6379,
      REDIS_PWD:"LPJQoIcvl0",
	  WS_REDIS_URL:"119.23.215.121",
      WS_REDIS_PORT:6379,
      WS_REDIS_PWD:"LPJQoIcvl0",
    }
  },

  {
    name: "mist-poa-watcher-ts",
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
    name: "mist-poa-laucher-ts",
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
    name: "mist-poa-express-ts",
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
    name: "mist-poa-bridge-ts",
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
{
    name: "mist-data-process-ts",
    script: "./dist/data_process",
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
