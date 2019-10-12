

#!/bin/bash

#curl -v http://119.23.181.166:13000/adex/list_trades
i=3;
markets_arr=("ASIM-PAI" "BTC-PAI" "XRP-PAI"  "ASIM-BTC" "XRP-BTC" "VLS-ASIM")
while((1));
do
	for marketID in ${markets_arr[@]}
	do
	price=$(($(($RANDOM % 50)) + 1));
	amount=$(($(($RANDOM % 20)) + 1));
	curl -v http://119.23.181.166:13000/adex/build_order?market_id=$marketID\&side="buy"\&price=${price}\&amount=${amount}\&trader_address="0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9";
	sleep 10;

	price2=$(($(($RANDOM % 50)) + 1));
	amount2=$(($(($RANDOM % 20)) + 1));
	curl -v http://119.23.181.166:13000/adex/build_order?market_id=$marketID\&side="sell"\&price=${price2}\&amount=${amount2}\&trader_address="0x66b7637198aee4fffa103fc0082e7a093f81e05a64";
	sleep 10;

	price3=$(($(($RANDOM % 50)) + 1));
	amount3=$(($(($RANDOM % 20)) + 1));
	curl -v http://119.23.181.166:13000/adex/build_order?market_id=$marketID\&side="buy"\&price=${price}\&amount=${amount}\&trader_address="0x66b7637198aee4fffa103fc0082e7a093f81e05a64";
	sleep 10;

	price4=$(($(($RANDOM % 50)) + 1));
	amount4=$(($(($RANDOM % 20)) + 1));
	curl -v http://119.23.181.166:13000/adex/build_order?market_id=$marketID\&side="sell"\&price=${price2}\&amount=${amount2}\&trader_address="0x6632bd37c1331b34359920f1eaa18a38ba9ff203e9";
	sleep 10;
	done
done

