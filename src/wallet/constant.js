export const CONSTANT = {
  VERSION: "VERSION_NUM:BUILDNR",
  DEFAULT_PASSWORD: "8R!GHWzj!Z*G89VGW3dm6mgRheVVPM#kuijwML45L70pxXKwYAYB2pmPvWGxTVfN",
  DEFAULT_SALT: "657c59a622030c54c7e3e3b59fb0f97e",
  HTTPTIMEOUT: 30000,
  CREATEADDRSNUM: 20,
  DEFAULT_COIN: {
    name: "ASCoin",
    coinSlug: "ASCoin",
    coinName: "AS",
    coinType: 10003,
    icon: "as",
    addressPrefix: "ascoin",
    asset: '000000000000000000000000',
    unit: "as",
    balance: 0
  },
  DEFAULT_ASSET: '000000000000000000000000',
  COINS: [{
      name: "ASCoin",
      coinSlug: "ASCoin",
      coinName: "AS",
      coinType: 10003,
      icon: "as",
      addressPrefix: "ascoin",
      asset: '000000000000000000000000',
      unit: "as",
      balance: 0
    },
    {
      name: "Fee",
      coinSlug: "FeeCoin",
      coinName: "FEE",
      coinType: 10003,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000000001010101',
      unit: "fee",
      balance: 0
    },
	{
      name: "fbtc2",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000000300000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "pai",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000000500000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "mpai",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001f00000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "musdt",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001b00000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "meth",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001400000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "mbtc",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001800000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "mmt",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001600000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "mmt",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001500000001',
      unit: "fee",
      balance: 0
    },
	{
      name: "mmt",
      coinSlug: "fbtctoken",
      coinName: "FEE",
      coinType: 10005,
      icon: "default",
      addressPrefix: "feecoin",
      asset: '000000000000001700000001',
      unit: "fee",
      balance: 0
    }





  ],

  DEPLOY_CONTRACT_SENDAMOUNT: 0,
  DEFAULT_CURRENCY: "USD",
  CURRENCY_ICON: {
    USD: "flag_icon_unitedstates.jpg",
    EUR: "flag_icon_eu.jpg",
    JPY: "flag_icon_japan.jpg",
    CNY: "flag_icon_china.jpg",
    GBP: "flag_icon_unitedkingdom.jpg",
    AUD: "flag_icon_australia.jpg",
    CAD: "flag_icon_canada.jpg",
    CHF: "flag_icon_swiss.jpg",
    SEK: "flag_icon_sweden.jpg",
    NZD: "flag_icon_newzealand.jpg",
    MXN: "flag_icon_mexico.jpg",
    SGD: "flag_icon_singapore.jpg",
    HKD: "flag_icon_hongkong.jpg",
    NOK: "flag_icon_norway.jpg",
    KRW: "flag_icon_southkorean.jpg"
  },
  LANGUAGES: [
    { language: "简体中文", shorthand: "zh", icon: "china" },
    { language: "English", shorthand: "en", icon: "england" }
  ],
  MNEMONICLANGUAGES: [
    "chinese_simplified",
    "chinese_traditional",
    "english",
    "french",
    "italian",
    "japanese",
    "spanish"
  ],
  WordListNameDict: {
    en: "english",
    zh: "chinese_simplified"
  },
  DEFAULT_NETWORK: {
    color: '#02BA3D',
    value: 'devnet',
    name: 'Dev Network'
  },
  NETWORKS: [{
    color: '#02BA3D',
    value: 'devnet',
    name: 'Dev Network'
  }, {
    color: '#FF8200',
    value: 'testnet',
    name: 'Test Network'
  }],
  // PASSWORD_REG: /(?=.*[0-9].*)(?=.*[a-z].*){8,}/,
  PASSWORD_REG: /^[A-Za-z0-9`~!@#$%^&*()_\-+={}\[\]\\|:;"'<>,.?/]{8,}$/,
  ASSETINFO_ABI: [{ "constant": true, "inputs": [{ "name": "assetIndex", "type": "uint32" }], "name": "getAssetInfo", "outputs": [{ "name": "", "type": "bool" }, { "name": "", "type": "string" }, { "name": "", "type": "string" }, { "name": "", "type": "string" }, { "name": "", "type": "uint32" }, { "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }],
  ASSETINFO_ABI_NAME: 'getAssetInfo',
  CONTRACT_TYPE:{
    NORMAL:"",
    CALL:"call",
    CREATE:"create"
  }
};
