insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-PI', '0x638f6ee4c805bc7a8558c1cf4df074a38089f6fbfe','ASIM', '0x6374cb5f6ddc3ab13a64348aceb47418f22d8aa011','PI', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('MT-PI', '0x63d60e5b650904dff31ad423d8a4c184f301361306','MT', '0x6374cb5f6ddc3ab13a64348aceb47418f22d8aa011','PI', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('USDT-PI', '0x63ef0af0e4aaefa0a5f19114cfa70955455d48667b','USDT', '0x6374cb5f6ddc3ab13a64348aceb47418f22d8aa011','PI', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-USDT', '0x638f6ee4c805bc7a8558c1cf4df074a38089f6fbfe','ASIM', '0x63ef0af0e4aaefa0a5f19114cfa70955455d48667b','USDT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-USDT', '0x632d556d2a57f09abd3cf75ff8a8a99801ba77808b','ETH', '0x63ef0af0e4aaefa0a5f19114cfa70955455d48667b','USDT', NOW());

insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ETH-MT', '0x632d556d2a57f09abd3cf75ff8a8a99801ba77808b','ETH', '0x63d60e5b650904dff31ad423d8a4c184f301361306','MT', NOW());
insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('BTC-MT', '0x6383f2548fb59281e0ad0cb8e80ea6f1c7bc820092','BTC', '0x63d60e5b650904dff31ad423d8a4c184f301361306','MT', NOW());








insert into mist_tokens (address, symbol, name, decimals) values ('0x6374cb5f6ddc3ab13a64348aceb47418f22d8aa011', 'PI','PII', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x638f6ee4c805bc7a8558c1cf4df074a38089f6fbfe', 'ASIM','ASIMM', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x6383f2548fb59281e0ad0cb8e80ea6f1c7bc820092', 'BTC','BTCC', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x63ef0af0e4aaefa0a5f19114cfa70955455d48667b', 'USDT','USDTS', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x632d556d2a57f09abd3cf75ff8a8a99801ba77808b', 'ETH','ETHP', 18);
insert into mist_tokens (address, symbol, name,decimals) values ('0x63d60e5b650904dff31ad423d8a4c184f301361306', 'MT','MTT', 18);
