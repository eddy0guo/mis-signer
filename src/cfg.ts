import * as Queue from 'bull';

interface IConfig {
  // TEST ONLY
  order_hash_word: string,
  fauct_address: string,
  fauct_word: string,
  fauct_prikey: string,

  ex_address: string,
  mist_earnings_address: string,
  relayers: {prikey: string,word: string,address: string}[],

  bridge_word: string,
  bridge_address: string,

  express_word: string,
  express_address: string,

  wallet_default_passwd: string,
  asimov_chain_rpc: string,
  asimov_master_rpc: string,
  asimov_child_rpc: string,
  mist_server_port: number,

  pg_host: string,
  pg_database: string,
  pg_user: string,
  pg_password: string,
  pg_port: number,
  icon_url: string,
  ws_port: number,
}


const local:IConfig = {
  ex_address: '0x63722839a7d46e75e4cd9f40edc7680651143084ae',
  mist_earnings_address:'0x634b2ee429ce7dd2d1540dfd8ee5475b5a144ce71a',
  order_hash_word:
    'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
  fauct_address: '0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
  fauct_word:
    'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
  fauct_prikey:
    '0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a',

  relayers: [
    {
      prikey:
        '0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce',
      word:
        'two earn wide ignore month spider seek wage enrich stuff small day',
      address: '0x66e900c058c225d973949c1cb162c23c810a7417d3',
    },
    {
      prikey:
        '0xb4969d5aeb8c0bcc833b9537e38c60e2ba01cd45ae7a3e77e3d936252209ca49',
      word:
        'inmate truly february tray slim receive secret route clutch magnet bike inform',
      address: '0x66a1c3eeaa9dddec4e1fc3a352a3250d8da91bce31',
    },
    {
      prikey:
        '0x1f06c8b003fa13b3ae74dd8e2320468da652ed40899d8b4eec4279de75bf6030',
      word:
        'setup letter modify bronze embark label elegant crash argue glare amazing photo',
      address: '0x66c84eef87209999154a108ee968ef81ce690dcb20',
    },
  ],

  // 0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c
  bridge_word:
    'sound mandate urban welcome grass gospel gather shoulder hunt catch host second',
  bridge_address: '0x66a5e2e1d9243f9dfd1d54b31952d94043a105188f',

  express_word:
    'wing safe foster choose wisdom myth quality own gallery logic imitate pink',
  express_address: '0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c',

  wallet_default_passwd: '111111',
  asimov_chain_rpc: 'https://rpc-master.mistabit.com',
  asimov_master_rpc: 'https://rpc-master.mistabit.com',
  asimov_child_rpc: 'https://rpc-child.mistabit.com',

  mist_server_port: 15000,
  pg_host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
  pg_database: process.env.MIST_MODE,
  pg_user: 'product',
  pg_password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
  pg_port: 1433,
  icon_url: 'http://fingo-cdn.asimov.work/res/icons/',
  ws_port: 13300,
};

const dev:IConfig = {
  ex_address: '0x630122b8d818203e407eaf9ba59668934b73198f4c',
  mist_earnings_address:'0x634b2ee429ce7dd2d1540dfd8ee5475b5a144ce71a',
  order_hash_word:
    'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
  fauct_address: '0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
  fauct_word:
    'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
  fauct_prikey:
    '0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a',

  relayers: [
    {
      prikey:
        '0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce',
      word:
        'two earn wide ignore month spider seek wage enrich stuff small day',
      address: '0x66e900c058c225d973949c1cb162c23c810a7417d3',
    },
    {
      prikey:
        '0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce',
      word:
        'two earn wide ignore month spider seek wage enrich stuff small day',
      address: '0x66e900c058c225d973949c1cb162c23c810a7417d3',
    },
    {
      prikey:
        '0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce',
      word:
        'two earn wide ignore month spider seek wage enrich stuff small day',
      address: '0x66e900c058c225d973949c1cb162c23c810a7417d3',
    },
  ],
  // 0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c
  bridge_word:
    'crouch spring portion wide mention deposit water renew lake switch amount danger',
  bridge_address: '0x663eba898c351ca8b5ff8de3f3c380de88ee8061f7',

  express_word:
    'solve page fuel once ghost team move trophy flag coil suffer fan',
  express_address: '0x66d0594c76342ec891017d0639792ffc7872b4df81',

  wallet_default_passwd: '111111',
  asimov_chain_rpc: 'https://rpc.fin.fingo.dev',
  asimov_master_rpc: 'https://rpc.fin.fingo.dev',
  asimov_child_rpc: 'https://rpc.mt.fingo.dev',
  mist_server_port: 16000,
  pg_host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
  pg_database: process.env.MIST_MODE,
  pg_user: 'product',
  pg_password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
  pg_port: 1433,
  icon_url: 'http://fingo-cdn.asimov.work/res/icons/',
  ws_port: 13300,
};

const product:IConfig = {
    ex_address:'0x630122b8d818203e407eaf9ba59668934b73198f4c',
    mist_earnings_address:'0x669952fb5d185d36b168b9f6c3bbeade4ad6510aee',
    order_hash_word:'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
    fauct_address:'0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
    fauct_word:'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
    fauct_prikey:'0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a',
    relayers:[
        {
            prikey:'0x1f06c8b003fa13b3ae74dd8e2320468da652ed40899d8b4eec4279de75bf6030',
            word:'setup letter modify bronze embark label elegant crash argue glare amazing photo',
            address:'0x66c84eef87209999154a108ee968ef81ce690dcb20'
        },{
            prikey:'0x1f06c8b003fa13b3ae74dd8e2320468da652ed40899d8b4eec4279de75bf6030',
            word:'setup letter modify bronze embark label elegant crash argue glare amazing photo',
            address:'0x66c84eef87209999154a108ee968ef81ce690dcb20'
        },{
            prikey:'0x1f06c8b003fa13b3ae74dd8e2320468da652ed40899d8b4eec4279de75bf6030',
            word:'setup letter modify bronze embark label elegant crash argue glare amazing photo',
            address:'0x66c84eef87209999154a108ee968ef81ce690dcb20'
    }],
    bridge_word:'sound mandate urban welcome grass gospel gather shoulder hunt catch host second',
    bridge_address:'0x66a5e2e1d9243f9dfd1d54b31952d94043a105188f',

    express_word:'wing safe foster choose wisdom myth quality own gallery logic imitate pink',
    express_address:'0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c',

    wallet_default_passwd:'111111',
    asimov_chain_rpc: 'https://rpc.fin.fingo.dev',
    asimov_master_rpc: 'https://rpc.fin.fingo.dev',
    asimov_child_rpc: 'https://rpc.mt.fingo.dev',
    mist_server_port:21000,
    pg_host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
    pg_database: process.env.MIST_MODE,
    pg_user: 'product',
    pg_password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
    pg_port: 1433,
	icon_url: 'http://fingo-cdn.asimov.work/res/icons/',
    ws_port: 13300,
}

const CONFIG_K8S:IConfig = {
  // TEST ONLY
  order_hash_word: '',
  fauct_address: '',
  fauct_word: '',
  fauct_prikey: '',

  ex_address: process.env.EX_ADDRESS,
 // mist_earnings_address:process.env.EARNINGS_ADDRESS,
  mist_earnings_address:'0x634b2ee429ce7dd2d1540dfd8ee5475b5a144ce71a',
  relayers: [
    {
      prikey: process.env.RELAYER_KEY,
      word: process.env.RELAYER_WORD,
      address: process.env.RELAYER_ADDRESS,
    },
    {
      prikey: process.env.RELAYER_KEY,
      word: process.env.RELAYER_WORD,
      address: process.env.RELAYER_ADDRESS,
    },
    {
      prikey: process.env.RELAYER_KEY,
      word: process.env.RELAYER_WORD,
      address: process.env.RELAYER_ADDRESS,
    },
  ],

  bridge_word: process.env.BRIDGE_WORD,
  bridge_address: process.env.BRIDGE_ADDRESS,

  express_word: process.env.EXPRESS_WORD,
  express_address: process.env.EXPRESS_ADDRESS,

  wallet_default_passwd: process.env.WALLET_PASSWORD,
  asimov_chain_rpc: process.env.RPC_FIN,
  asimov_master_rpc: process.env.RPC_FIN,
  asimov_child_rpc: process.env.RPC_MT,
  mist_server_port: Number(process.env.SERVER_PORT),

  pg_host: process.env.PG_HOST,
  pg_database: process.env.PG_DB,
  pg_user: process.env.PG_USER,
  pg_password: process.env.PG_PASS,
  pg_port: Number(process.env.PG_PORT),
  icon_url: 'https://fingo-huadong.oss-cn-shanghai.aliyuncs.com/res/icons/',
  ws_port: 13300,
};

let mistConfig:IConfig;
switch (process.env.MIST_MODE) {
  case 'local':
    mistConfig = local;
    break;
  case 'dev':
    mistConfig = dev;
    break;
  case 'product':
    mistConfig = product;
    break;
  case 'k8s':
    mistConfig = CONFIG_K8S;
    break;
  default:
    mistConfig = dev;
}
// var mistConfig = mistConfig_test;
export default mistConfig;

const BullOption: Queue.QueueOptions = {
  redis: {
      port: process.env.MIST_MODE === 'k8s' ? Number(process.env.REDIS_PORT):6379,
      host: process.env.MIST_MODE === 'k8s' ? process.env.REDIS_URL:'119.23.215.121',
      password: process.env.MIST_MODE === 'k8s' ? process.env.REDIS_PWD:'LPJQoIcvl0'
      // port: Number(process.env.REDIS_PORT || 6379),
      // host: process.env.REDIS_URL || '127.0.0.1',
      // password: process.env.REDIS_PWD
  }
};

const OrderQueueConfig = {
  maxWaiting:100,
}

export {BullOption,OrderQueueConfig};
