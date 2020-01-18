# Mist Signer

## Getting Started

---------------

```sh

# mangodb for did
brew install mongodb
mongod --dbpath '/Users/xxx/data/db'

# postgres db for engine
docker stop mist-dex-pg
docker rm mist-dex-pg
docker-compose up db

# Install dependencies
npm install

# Start development live-reload server
PORT=6666 npm run dev

# Start production server:
PORT=8080 npm start
```

## Docker Support

```sh

# Build your docker
docker build -t mist/api-service .
#            ^      ^           ^
#          tag  tag name      Dockerfile location

# run your docker
docker run -p 8080:8080 mist/api-service
#                 ^            ^
#          bind the port    container tag
#          to your host
#          machine port   

```

## DID & Union Bank

冷存储
分布于多个国家的多签方案
私钥永不接触公网
转出地址白名单机制

热储存
运维人员永远不接触私钥
自动化多地多签方案
确保私钥安全前提下的即时存取
冷热存储池之间智能风控
可定制的提币限额、白名单
可定制的角色、审批流程
批量打币、入账提醒、流水对账
资产报告和审计追踪

## TODO

- [x] JWT
- [x] POA Nodes
- [x] WebSocket
- [x] 多币种划转
- [ ] BTC充提币
- [ ] ETH充提币
- [ ] USDT（ERC20）充提币
- [ ] DB的安全部署

## Init 
目前配置的是RDS，注意不要在生产环境下make seed或者其他的删数据的情况，
source product.env
cd  src/adex/models/ && make seed 
cd -
cd  src/express/models/ && make seed 

## Deploy

```bash
npm run build
pm2 start pm2-mist.config.js --only mist --env production
```

## running mode

### test mode

source mist_test.env

### product mode

source mist_product.env
