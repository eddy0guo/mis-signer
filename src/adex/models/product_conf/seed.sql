insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ASIM-CNYC', '0x639cd472b32a51690f6a3c4c8610536a5c4c339fd7','ASIM', '0x63fb23599aec99b1f9e1267190b17d82ecdae36c19','CNYC', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('MT-CNYC', '0x630c4d576096fbe5a2a8c0f1017772cf84858ac8c0','MT', '0x63fb23599aec99b1f9e1267190b17d82ecdae36c19','CNYC', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('USDT-CNYC', '0x63516796902288f51277805dd097419b0d8f1e34c8','USDT', '0x63fb23599aec99b1f9e1267190b17d82ecdae36c19','CNYC', true,NOW(),NOW() + '10 years',NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('BTC-CNYC', '0x63f85fc978c2376115937fef0c1f0d5fbd9367529c','BTC', '0x63fb23599aec99b1f9e1267190b17d82ecdae36c19','CNYC', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ETH-CNYC', '0x6386fec100ecde81020d174b93e7be4f78626f193e','ETH', '0x63fb23599aec99b1f9e1267190b17d82ecdae36c19','CNYC', true,NOW(),NOW() + '10 years',NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ASIM-USDT', '0x639cd472b32a51690f6a3c4c8610536a5c4c339fd7','ASIM', '0x63516796902288f51277805dd097419b0d8f1e34c8','USDT', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ETH-USDT', '0x6386fec100ecde81020d174b93e7be4f78626f193e','ETH', '0x63516796902288f51277805dd097419b0d8f1e34c8','USDT', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('BTC-USDT', '0x63f85fc978c2376115937fef0c1f0d5fbd9367529c','BTC', '0x63516796902288f51277805dd097419b0d8f1e34c8','USDT', true,NOW(),NOW() + '10 years',NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('ETH-MT', '0x6386fec100ecde81020d174b93e7be4f78626f193e','ETH', '0x630c4d576096fbe5a2a8c0f1017772cf84858ac8c0','MT', true,NOW(),NOW() + '10 years',NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,online,up_at,down_at,created_at) values ('BTC-MT', '0x63f85fc978c2376115937fef0c1f0d5fbd9367529c','BTC', '0x630c4d576096fbe5a2a8c0f1017772cf84858ac8c0','MT', true,NOW(),NOW() + '10 years',NOW());


insert into mist_tokens (address, symbol, name, decimals,asim_address,asim_assetid) values ('0x63fb23599aec99b1f9e1267190b17d82ecdae36c19', 'CNYC','CNYCI', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000600000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x639cd472b32a51690f6a3c4c8610536a5c4c339fd7', 'ASIM','ASIMM', 8,'','000000000000000000000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63f85fc978c2376115937fef0c1f0d5fbd9367529c', 'BTC','BTCC', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000500000001');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63516796902288f51277805dd097419b0d8f1e34c8', 'USDT','USDTS', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000500000003');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x6386fec100ecde81020d174b93e7be4f78626f193e', 'ETH','ETHP', 8,'0x63ed080e7f11494e7563fff04668dfddc1555398de','000000000000000500000002');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x630c4d576096fbe5a2a8c0f1017772cf84858ac8c0', 'MT','MTT', 8,'0x632afcb303c312d0e1f4cf429212d005b76a496886','000000000000000700000001');

insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('CNYC','000000000000000600000000','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('ASIM','000000000000000000000000','',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('BTC','000000000000000500000001','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('USDT','000000000000000500000003','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('ETH','000000000000000500000002','0x63ed080e7f11494e7563fff04668dfddc1555398de',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('MT','000000000000000700000001','0x632afcb303c312d0e1f4cf429212d005b76a496886',0,0);
