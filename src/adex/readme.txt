[db init]
cd model;make seed;make test


[start maker]
cd tools;sh maker.sh &

[start project]
cd ../../;sh start.sh

合约变更项目初始化流程：
1、在relayer里放足足够的手续费
2、部署mist交易所合约
3、部署新的ERC20合约，并且测试的taker要在每个合约代币上approve给ex_address一个大数
4、在mode里更换相应的mist_tokens、mist_markets的新合约地址
5、在api/engne.js和index.js目录以及../wallet/contract/mist_ex.js下更换新mist_ex地址和relayer地址已经relayer的私钥
6、sh start.sh 启动
