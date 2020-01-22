const local = {
    ex_address: '0x63722839a7d46e75e4cd9f40edc7680651143084ae',
    order_hash_word: 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
    fauct_address: '0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
    fauct_word: 'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
    fauct_prikey: '0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a',

    relayers: [
        {
            prikey: "0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce",
            word: "two earn wide ignore month spider seek wage enrich stuff small day",
            address: "0x66e900c058c225d973949c1cb162c23c810a7417d3"
        },
        {
            prikey: "0xb4969d5aeb8c0bcc833b9537e38c60e2ba01cd45ae7a3e77e3d936252209ca49",
            word: "inmate truly february tray slim receive secret route clutch magnet bike inform",
            address: "0x66a1c3eeaa9dddec4e1fc3a352a3250d8da91bce31"
        },
        {
            prikey: "0x1f06c8b003fa13b3ae74dd8e2320468da652ed40899d8b4eec4279de75bf6030",
            word: "setup letter modify bronze embark label elegant crash argue glare amazing photo",
            address: "0x66c84eef87209999154a108ee968ef81ce690dcb20"
        }],

    //0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c
    bridge_word: "sound mandate urban welcome grass gospel gather shoulder hunt catch host second",
    bridge_address: "0x66a5e2e1d9243f9dfd1d54b31952d94043a105188f",

    express_word: "wing safe foster choose wisdom myth quality own gallery logic imitate pink",
    express_address: "0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c",

    wallet_default_passwd: "111111",
    did_seed_word: "wing safe foster choose wisdom myth quality own gallery logic imitate pink",
    asimov_chain_rpc: "https://rpc-master.mistabit.com",
    asimov_master_rpc: "https://rpc-master.mistabit.com",
    asimov_child_rpc: "https://rpc-child.mistabit.com",

    mist_server_port: 15000,
    pg_host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
    pg_database: process.env.MIST_MODE,
    pg_user: 'product',
    pg_password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
    pg_port: 1433,

}

const dev = {
    ex_address: '0x630329112990e5246f67ae0de752225d56e33e3121',
    order_hash_word: 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
    fauct_address: '0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
    fauct_word: 'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
    fauct_prikey: '0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a',

    relayers: [
        {
            prikey: "0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce",
            word: "two earn wide ignore month spider seek wage enrich stuff small day",
            address: "0x66e900c058c225d973949c1cb162c23c810a7417d3"
        },
        {
            prikey: "0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce",
            word: "two earn wide ignore month spider seek wage enrich stuff small day",
            address: "0x66e900c058c225d973949c1cb162c23c810a7417d3"
        },
        {
            prikey: "0xb74dec46bddca59a39bbbb309ccf48f97be5ca5f980c62fab635a749f5f317ce",
            word: "two earn wide ignore month spider seek wage enrich stuff small day",
            address: "0x66e900c058c225d973949c1cb162c23c810a7417d3"
        }],
    //0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c
    bridge_word: "sound mandate urban welcome grass gospel gather shoulder hunt catch host second",
    bridge_address: "0x66a5e2e1d9243f9dfd1d54b31952d94043a105188f",

    express_word: "wing safe foster choose wisdom myth quality own gallery logic imitate pink",
    express_address: "0x66b7a9a597306b5fb16909b515c654f30a4c2eb74c",

    wallet_default_passwd: "111111",
    did_seed_word: "wing safe foster choose wisdom myth quality own gallery logic imitate pink",
    asimov_chain_rpc: "https://rpc-fin.fingo.com",
    asimov_master_rpc: "https://rpc-fin.fingo.com",
    asimov_child_rpc: "https://rpc-mt.fingo.com",
    mist_server_port: 16000,
    pg_host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
    pg_database: process.env.MIST_MODE,
    pg_user: 'product',
    pg_password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
    pg_port: 1433,
}

const product = {
    ex_address: '0x632b1c1248dba408e634a317184dd153d7856f4d0c',
    //order_hash_word,fauct_address,fauct_word,fauct_prikey 先不用管之前测试用的
    order_hash_word: 'enhance donor garment gospel loop purse pumpkin bag oven bone decide street',
    fauct_address: '0x666234b6348c10fed282b95c1f1768aa3113eb96b2',
    fauct_word: 'tag pear master thank vehicle gap medal eyebrow asthma paddle kiss cook',
    fauct_prikey: '0x47c98c143179d48664dfc2f029a8583cb6a394a94037e06f0658dcf18ed6c66a',
    
    relayers: [
        {
            prikey: process.env.RELAYER_KEY,
            word: process.env.RELAYER_WORD,
            address: "0x66e825eeb359bf979df31e905fb4a98b98ec1fed80"
        },
        {
            prikey: process.env.RELAYER_KEY,
            word: process.env.RELAYER_WORD,
            address: "0x66e825eeb359bf979df31e905fb4a98b98ec1fed80"
        },
        {
            prikey: process.env.RELAYER_KEY,
            word: process.env.RELAYER_WORD,
            address: "0x66e825eeb359bf979df31e905fb4a98b98ec1fed80"
        }],
    bridge_word: process.env.BRIDGE_WORD,
    bridge_address: "0x6691a461d7c86d87c8d38f123c28a6f9748699cbd2",

    express_word: process.env.EXPRESS_WORD,
    express_address: "0x66da57e2f3de41861d69d233213894d4082c0822ee",

    wallet_default_passwd: "111111",
    asimov_chain_rpc: "https://rpc.fin.fingo.com",
    asimov_master_rpc: "https://rpc.fin.fingo.com",
    asimov_child_rpc: "https://rpc.mt.fingo.com",
    mist_server_port: 21000,
    pg_host: 'pgm-wz9m1yb4h5g4sl7x127770.pg.rds.aliyuncs.com',
    pg_database: process.env.MIST_MODE,
    pg_user: 'product',
    pg_password: 'myHzSesQc7TXSS5HOXZDsgq7SNUHY2',
    pg_port: 1433,
}

const CONFIG_K8S = {
    // TEST ONLY
    order_hash_word: '',
    fauct_address: '',
    fauct_word: '',
    fauct_prikey: '',

    ex_address: process.env.EX_ADDRESS,
    relayers: [
        {
            prikey: process.env.RELAYER_KEY,
            word: process.env.RELAYER_WORD,
            address: process.env.RELAYER_ADDRESS
        },
        {
            prikey: process.env.RELAYER_KEY,
            word: process.env.RELAYER_WORD,
            address: process.env.RELAYER_ADDRESS
        },
        {
            prikey: process.env.RELAYER_KEY,
            word: process.env.RELAYER_WORD,
            address: process.env.RELAYER_ADDRESS
        }],

    bridge_word: process.env.BRIDGE_WORD,
    bridge_address: process.env.BRIDGE_ADDRESS,

    express_word: process.env.EXPRESS_WORD,
    express_address: process.env.EXPRESS_ADDRESS,

    wallet_default_passwd: process.env.WALLET_PASSWORD,
    asimov_chain_rpc: process.env.RPC_FIN,
    asimov_master_rpc: process.env.RPC_FIN,
    asimov_child_rpc: process.env.RPC_MT,
    mist_server_port: process.env.SERVER_PORT,

    pg_host: process.env.PG_HOST,
    pg_database: process.env.PG_DB,
    pg_user: process.env.PG_USER,
    pg_password: process.env.PG_PASS,
    pg_port: process.env.PG_PORT||1433,
}

var mist_config;
switch (process.env.MIST_MODE) {
    case 'local':
        mist_config = local;
        break;
    case 'dev':
        mist_config = dev;
        break;
    case 'product':
        mist_config = product;
        break;
    case 'k8s':
        mist_config = CONFIG_K8S;
        break;
    default:
        mist_config = local;
}
//var mist_config = mist_config_test;
export default mist_config
