insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-CNYC', '0x6345fba46219b9cf6c62e090e5753df302ebfcf374','ASIM', '0x63fc1a4989e656387e351610ccc916dde39a2cfa7e','CNYC', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('MT-CNYC', '0x639eede549711dae12f683486fff42133cb594fc13','MT', '0x63fc1a4989e656387e351610ccc916dde39a2cfa7e','CNYC', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('USDT-CNYC', '0x63e1385fc6493ee85bcd6b17d56c4c690951fee1e0','USDT', '0x63fc1a4989e656387e351610ccc916dde39a2cfa7e','CNYC', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-CNYC', '0x63086a61a5d0269cb1d6c22a9fc829585fb21fdaa9','BTC', '0x63fc1a4989e656387e351610ccc916dde39a2cfa7e','CNYC', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-CNYC', '0x639b93ed84ea37ae3ec9ecffe44dcc7c83c44b5a3a','ETH', '0x63fc1a4989e656387e351610ccc916dde39a2cfa7e','CNYC', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-USDT', '0x6345fba46219b9cf6c62e090e5753df302ebfcf374','ASIM', '0x63e1385fc6493ee85bcd6b17d56c4c690951fee1e0','USDT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-USDT', '0x639b93ed84ea37ae3ec9ecffe44dcc7c83c44b5a3a','ETH', '0x63e1385fc6493ee85bcd6b17d56c4c690951fee1e0','USDT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-USDT', '0x63086a61a5d0269cb1d6c22a9fc829585fb21fdaa9','BTC', '0x63e1385fc6493ee85bcd6b17d56c4c690951fee1e0','USDT', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-MT', '0x639b93ed84ea37ae3ec9ecffe44dcc7c83c44b5a3a','ETH', '0x639eede549711dae12f683486fff42133cb594fc13','MT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-MT', '0x63086a61a5d0269cb1d6c22a9fc829585fb21fdaa9','BTC', '0x639eede549711dae12f683486fff42133cb594fc13','MT', NOW());


insert into mist_tokens (address, symbol, name, decimals,asim_address,asim_assetid) values ('0x63fc1a4989e656387e351610ccc916dde39a2cfa7e', 'CNYC','CNYCI', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000600000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x6345fba46219b9cf6c62e090e5753df302ebfcf374', 'ASIM','ASIMM', 8,'','000000000000000000000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63086a61a5d0269cb1d6c22a9fc829585fb21fdaa9', 'BTC','BTCC', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000500000001');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63e1385fc6493ee85bcd6b17d56c4c690951fee1e0', 'USDT','USDTS', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000500000003');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x639b93ed84ea37ae3ec9ecffe44dcc7c83c44b5a3a', 'ETH','ETHP', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000500000002');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x639eede549711dae12f683486fff42133cb594fc13', 'MT','MTT', 8,'0x632afcb303c312d0e1f4cf429212d005b76a496886','000000000000000700000001');

insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('CNYC','000000000000000600000000','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('ASIM','000000000000000000000000','',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('BTC','000000000000000500000001','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('USDT','000000000000000500000003','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('ETH','000000000000000500000002','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('MT','000000000000000700000001','0x632afcb303c312d0e1f4cf429212d005b76a496886',0,0);
