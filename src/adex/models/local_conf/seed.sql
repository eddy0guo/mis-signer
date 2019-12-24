insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-CNYc', '0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643','ASIM', '0x638374231575328e380610fbb12020c29e11afcd01','CNYc', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('MT-CNYc', '0x6382b81526d098e3ed8d013df2963c7410fea593d1','MT', '0x638374231575328e380610fbb12020c29e11afcd01','CNYc', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('USDT-CNYc', '0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76','USDT', '0x638374231575328e380610fbb12020c29e11afcd01','CNYc', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-CNYc', '0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c','BTC', '0x638374231575328e380610fbb12020c29e11afcd01','CNYc', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-CNYc', '0x63720b32964170980b216cabbb4ecdd0979f8c9c17','ETH', '0x638374231575328e380610fbb12020c29e11afcd01','CNYc', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-USDT', '0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643','ASIM', '0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76','USDT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-USDT', '0x63720b32964170980b216cabbb4ecdd0979f8c9c17','ETH', '0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76','USDT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-USDT', '0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c','BTC', '0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76','USDT', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-MT', '0x63720b32964170980b216cabbb4ecdd0979f8c9c17','ETH', '0x6382b81526d098e3ed8d013df2963c7410fea593d1','MT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-MT', '0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c','BTC', '0x6382b81526d098e3ed8d013df2963c7410fea593d1','MT', NOW());


insert into mist_tokens (address, symbol, name, decimals,asim_address,asim_assetid) values ('0x638374231575328e380610fbb12020c29e11afcd01', 'CNYc','CNYcI', 8,'0x637d9b9f839bd534269a1618e4b245266eab5d9acb','000000000000000c00000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x637cffb37ebe8a19eb1d227e7678b27c60ad6be643', 'ASIM','ASIMM', 8,'','000000000000000000000000');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63d202a9f65a4de95f7b2ea1ea632bfc27f10dff8c', 'BTC','BTCC', 8,'0x637d9b9f839bd534269a1618e4b245266eab5d9acb','000000000000000b00000001');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x634277ed606d5c01fa24e9e057fcfa7fedea36bc76', 'USDT','USDTS', 8,'0x63ab76a6e66555641388e9ef2bea5ae9a9b845e63d','000000000000000b00000003');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x63720b32964170980b216cabbb4ecdd0979f8c9c17', 'ETH','ETHP', 8,'0x63ab76a6e66555641388e9ef2bea5ae9a9b845e63d','000000000000000b00000002');
insert into mist_tokens (address, symbol, name,decimals,asim_address,asim_assetid) values ('0x6382b81526d098e3ed8d013df2963c7410fea593d1', 'MT','MTT', 8,'0x63ab76a6e66555641388e9ef2bea5ae9a9b845e63d','000000000000000300000003');

insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('CNYc','000000000000000c00000000','0x632a763080db1e7d1576a074763381da3678087c75',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('ASIM','000000000000000000000000','',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('BTC','000000000000000b00000001','0x632a763080db1e7d1576a074763381da3678087c75',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('USDT','000000000000000b00000003','0x632a763080db1e7d1576a074763381da3678087c75',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('ETH','000000000000000b00000002','0x632a763080db1e7d1576a074763381da3678087c75',0,0);
insert into asim_assets_info (asset_name, asset_id, contract_address,total,yesterday_total) values ('MT','000000000000000300000003','0x63ab76a6e66555641388e9ef2bea5ae9a9b845e63d',0,0);
