var config_local = {
    accounts : [
        "13682471710",
        "13682471714"],
    password : [

    ],
    addresses : [
        "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
        "0x66fb54e73b1ea0a40ca95c5a514500902dc19f2d61"],
}

var config_product = {
    accounts : [
        "13682471710",
        "13682471711"],
    password : [

    ],
    addresses : [
        "0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9",
        "0x66b7637198aee4fffa103fc0082e7a093f81e05a64"],
}

var config_dev = {
    accounts : [
        "13682471717",
        "13682471718"],
    password : [

    ],
    addresses : [
        "0x66bb0fb407455e22ad2ea7d90db2b0fc41c4540675",
        "0x66202fab701a58b4b622ee07ac8ac11b872d727ced"],
}
var mist_config_hqpd = {};

var mist_config;
switch (process.env.MIST_MODE) {
	case 'local':
		mist_config = config_local;
		break;
	//old product
	case 'postgres':
		mist_config = config_postgres;
		break;
	//hongqiaotestnet
	case 'dev':
		mist_config = config_dev;
		break;
	//reserved for future use,hongqiaoproduct
	case 'product':
		mist_config = config_product;
		break;
	default:
		mist_config = config_local;
}
//var mist_config = mist_config_test;
export default mist_config
