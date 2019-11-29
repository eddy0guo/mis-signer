

#!/bin/bash

#curl -v http://119.23.181.166:13000/adex/list_trades
i=1;
init_price=0;
markets_arr=("ASIM-PI" "USDT-PI" "MT-PI"  "ASIM-USDT" "ETH-USDT" "BTC-MT" "ETH-MT" "BTC-PI" "ETH-PI" "BTC-USDT")
#markets_arr=("ASIM-PI")
account_arr=("13682471710" "13682471711")
address_arr=("0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9" "0x66b7637198aee4fffa103fc0082e7a093f81e05a64")
side_arr=("buy" "sell")
index_arr=(1 2)
while((1));
do
	for marketID in ${markets_arr[@]}
	do
		init_price=0;
		if [ "${marketID}" == "USDT-PI" ];then
		 	init_price=1;
		elif [ "${marketID}" == "BTC-PI" ];then
		 	init_price=2;
		elif [ "${marketID}" == "ETH-PI" ];then
		 	init_price=3;
		elif [ "${marketID}" == "BTC-USDT" ];then
		 	init_price=4;
		elif [ "${marketID}" == "ETH-USDT" ];then
		 	init_price=5;
		else
		  echo "Input Is Error.";
		fi
##
		price=$(($(($(($RANDOM % 50)) + 1)) + init_price));
		amount=$(($(($RANDOM % 20)) + 1));
		order_id=`curl -v http://119.23.181.166:25000/adex/get_order_id?marketID=$marketID\&side="buy"\&price=${price}\&amount=${amount}\&trader_address="0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9" | awk -F '"' '{print $2}'`;
		echo "order_id=====$order_id";
		sign=`curl http://119.23.181.166:25000/did/order_sign -H "Accept: application/json"  -H "Content-Type: application/json"  -d '{"username":"13682471710","order_id":"'${order_id}'"}' | jq '[.signature.r,  .signature.s, .signature.pubkey]' | awk -F '"' '{print $2}' `;
		echo "ssssssssss--${sign}";
		r=`echo ${sign} | awk -F ' ' '{print $1}' `
		s=`echo ${sign} | awk -F ' ' '{print $2}' `
		pubkey=`echo ${sign} | awk -F ' ' '{print $3}' `
		curl -v http://119.23.181.166:25000/adex/build_order?marketID=$marketID\&side="buy"\&price=${price}\&amount=${amount}\&trader_address="0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9"\&signature="\{\"r\":\"${r}\",\"s\":\"${s}\",\"pubkey\":\"${pubkey}\"\}"\&order_id=${order_id}
		echo -e "==================\n\n\n\n";
		sleep 1;


		price=$(($(($(($RANDOM % 50)) + 1)) + init_price));
		amount=$(($(($RANDOM % 20)) + 1));
		order_id=`curl -v http://119.23.181.166:25000/adex/get_order_id?marketID=$marketID\&side="sell"\&price=${price}\&amount=${amount}\&trader_address="0x66b7637198aee4fffa103fc0082e7a093f81e05a64" | awk -F '"' '{print $2}'`;
		echo "order_id=====$order_id1";
		sign=`curl http://119.23.181.166:25000/did/order_sign -H "Accept: application/json"  -H "Content-Type: application/json"  -d '{"username":"13682471711","order_id":"'${order_id}'"}' | jq '[.signature.r,  .signature.s, .signature.pubkey]' | awk -F '"' '{print $2}' `;
		echo "ssssssssss--${sign}";
		r=`echo ${sign} | awk -F ' ' '{print $1}' `
		s=`echo ${sign} | awk -F ' ' '{print $2}' `
		pubkey=`echo ${sign} | awk -F ' ' '{print $3}' `
		curl -v http://119.23.181.166:25000/adex/build_order?marketID=$marketID\&side="sell"\&price=${price}\&amount=${amount}\&trader_address="0x66b7637198aee4fffa103fc0082e7a093f81e05a64"\&signature="\{\"r\":\"${r}\",\"s\":\"${s}\",\"pubkey\":\"${pubkey}\"\}"\&order_id=${order_id}
		echo -e "==================\n\n\n\n";
		sleep 1;



		price=$(($(($(($RANDOM % 50)) + 1)) + init_price));
		amount=$(($(($RANDOM % 20)) + 1));
		order_id=`curl -v http://119.23.181.166:25000/adex/get_order_id?marketID=$marketID\&side="sell"\&price=${price}\&amount=${amount}\&trader_address="0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9" | awk -F '"' '{print $2}'`;
		echo "order_id=====$order_id";
		sign=`curl http://119.23.181.166:25000/did/order_sign -H "Accept: application/json"  -H "Content-Type: application/json"  -d '{"username":"13682471710","order_id":"'${order_id}'"}' | jq '[.signature.r,  .signature.s, .signature.pubkey]' | awk -F '"' '{print $2}' `;
		echo "ssssssssss--${sign}";
		r=`echo ${sign} | awk -F ' ' '{print $1}' `
		s=`echo ${sign} | awk -F ' ' '{print $2}' `
		pubkey=`echo ${sign} | awk -F ' ' '{print $3}' `
		curl -v http://119.23.181.166:25000/adex/build_order?marketID=$marketID\&side="sell"\&price=${price}\&amount=${amount}\&trader_address="0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9"\&signature="\{\"r\":\"${r}\",\"s\":\"${s}\",\"pubkey\":\"${pubkey}\"\}"\&order_id=${order_id}
		echo -e "==================\n\n\n\n";
		sleep 1;




		price=$(($(($(($RANDOM % 50)) + 1)) + init_price));
		amount=$(($(($RANDOM % 20)) + 1));
		order_id=`curl -v http://119.23.181.166:25000/adex/get_order_id?marketID=$marketID\&side="buy"\&price=${price}\&amount=${amount}\&trader_address="0x66b7637198aee4fffa103fc0082e7a093f81e05a64" | awk -F '"' '{print $2}'`;
		echo "order_id=====$order_id";
		sign=`curl http://119.23.181.166:25000/did/order_sign -H "Accept: application/json"  -H "Content-Type: application/json"  -d '{"username":"13682471711","order_id":"'${order_id}'"}' | jq '[.signature.r,  .signature.s, .signature.pubkey]' | awk -F '"' '{print $2}' `;
		echo "ssssssssss--${sign}";
		r=`echo ${sign} | awk -F ' ' '{print $1}' `
		s=`echo ${sign} | awk -F ' ' '{print $2}' `
		pubkey=`echo ${sign} | awk -F ' ' '{print $3}' `
		curl -v http://119.23.181.166:25000/adex/build_order?marketID=$marketID\&side="buy"\&price=${price}\&amount=${amount}\&trader_address="0x66b7637198aee4fffa103fc0082e7a093f81e05a64"\&signature="\{\"r\":\"${r}\",\"s\":\"${s}\",\"pubkey\":\"${pubkey}\"\}"\&order_id=${order_id}
		echo -e "==================\n\n\n\n";
		sleep 1;

	done
done

