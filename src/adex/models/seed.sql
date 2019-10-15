insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-PI', '0x639a9f78bdaac0a33b39de17c13cf7271d86800a7d','ASIM', '0x6376141c4fa5b11841f7dc186d6a9014a11efcbae6','PI', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('MT-PI', '0x63b98f4bf0360c91fec1668aafdc552d3c725f66bf','MT', '0x6376141c4fa5b11841f7dc186d6a9014a11efcbae6','PI', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('USDT-PI', '0x636b02db01ec1aa50abe1c2a8030b43b7a7867a308','USDT', '0x6376141c4fa5b11841f7dc186d6a9014a11efcbae6','PI', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-USDT', '0x639a9f78bdaac0a33b39de17c13cf7271d86800a7d','ASIM', '0x636b02db01ec1aa50abe1c2a8030b43b7a7867a308','USDT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-USDT', '0x6305ed5c64dcee4dd0065333b8bd677abc87762fd3','ETH', '0x636b02db01ec1aa50abe1c2a8030b43b7a7867a308','USDT', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-MT', '0x6305ed5c64dcee4dd0065333b8bd677abc87762fd3','ETH', '0x63b98f4bf0360c91fec1668aafdc552d3c725f66bf','MT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-MT', '0x63f6a701dd4bd8be879fc12fd4acdd93f01345d63e','BTC', '0x63b98f4bf0360c91fec1668aafdc552d3c725f66bf','MT', NOW());








insert into mist_tokens (address, symbol, name, decimals) values ('0x6376141c4fa5b11841f7dc186d6a9014a11efcbae6', 'PI','PII', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x639a9f78bdaac0a33b39de17c13cf7271d86800a7d', 'ASIM','ASIMM', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x63f6a701dd4bd8be879fc12fd4acdd93f01345d63e', 'BTC','BTCC', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x636b02db01ec1aa50abe1c2a8030b43b7a7867a308', 'USDT','USDTS', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x6305ed5c64dcee4dd0065333b8bd677abc87762fd3', 'ETH','ETHP', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x63b98f4bf0360c91fec1668aafdc552d3c725f66bf', 'MT','MTT', 18);
