insert into mist_markets (id,base_token_address,base_token_symbol,quote_token_address,quote_token_symbol,created_at) values ('ASIM-PAI', '0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf','ASIM', '0x63429bfcfdfbfa0048d1aeaa471be84675f1324a02','PAI', NOW());


insert into mist_tokens (address, symbol, decimals) values ('0x63429bfcfdfbfa0048d1aeaa471be84675f1324a02', 'PAI', 18);
insert into mist_tokens (address, symbol, decimals) values ('0x631f62ca646771cd0c78e80e4eaf1d2ddf8fe414bf', 'ASIM', 18);
