insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ASIM-CNYC', '0x636612e15fcf5c4f4ed364eeaf3e616ec8932d1a4d','ASIM', '0x63405243ab1961e46dddb4fa32da3ba4cf7f8f6d7d','CNYC', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('MT-CNYC', '0x6339aae5176e759d7e69cf17bbda9bcfabfc56bdd5','MT', '0x63405243ab1961e46dddb4fa32da3ba4cf7f8f6d7d','CNYC', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('USDT-CNYC', '0x638d3f1ce1d620215e8cbc6a44b960f7b477e86d15','USDT', '0x63405243ab1961e46dddb4fa32da3ba4cf7f8f6d7d','CNYC', true,NOW(),NOW() + '10 years',NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('BTC-CNYC', '0x63fea14a0df6f8f9ac7fe4f08d2244a6e7a1eee62e','BTC', '0x63405243ab1961e46dddb4fa32da3ba4cf7f8f6d7d','CNYC', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ETH-CNYC', '0x63a75cda5b6e6ce688676ead327e826e6a07d43553','ETH', '0x63405243ab1961e46dddb4fa32da3ba4cf7f8f6d7d','CNYC', true,NOW(),NOW() + '10 years',NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ASIM-USDT', '0x636612e15fcf5c4f4ed364eeaf3e616ec8932d1a4d','ASIM', '0x638d3f1ce1d620215e8cbc6a44b960f7b477e86d15','USDT', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ETH-USDT', '0x63a75cda5b6e6ce688676ead327e826e6a07d43553','ETH', '0x638d3f1ce1d620215e8cbc6a44b960f7b477e86d15','USDT', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('BTC-USDT', '0x63fea14a0df6f8f9ac7fe4f08d2244a6e7a1eee62e','BTC', '0x638d3f1ce1d620215e8cbc6a44b960f7b477e86d15','USDT', true,NOW(),NOW() + '10 years',NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ETH-MT', '0x63a75cda5b6e6ce688676ead327e826e6a07d43553','ETH', '0x6339aae5176e759d7e69cf17bbda9bcfabfc56bdd5','MT', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ASIM-MT', '0x636612e15fcf5c4f4ed364eeaf3e616ec8932d1a4d','ASIM', '0x6339aae5176e759d7e69cf17bbda9bcfabfc56bdd5','MT', true,NOW(),NOW() + '10 years',NOW());



insert into mist_tokens (address, symbol, name, decimals,asim_address,asim_assetid) values ('0x63405243ab1961e46dddb4fa32da3ba4cf7f8f6d7d', 'CNYC','CNYCI', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000300000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x636612e15fcf5c4f4ed364eeaf3e616ec8932d1a4d', 'ASIM','ASIMM', 8,'','000000000000000000000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63fea14a0df6f8f9ac7fe4f08d2244a6e7a1eee62e', 'BTC','BTCC', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000200000001');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x638d3f1ce1d620215e8cbc6a44b960f7b477e86d15', 'USDT','USDTS', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000200000003');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63a75cda5b6e6ce688676ead327e826e6a07d43553', 'ETH','ETHP', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000200000002');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x6339aae5176e759d7e69cf17bbda9bcfabfc56bdd5', 'MT','MTT', 8,'0x635a10ed666552ecb738d9a7a7ed58275e76d01d27','000000000000000500000001');

