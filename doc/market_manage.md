## 上线新币种，并且上线交易对
1、增添新币种
/add_token/:symbol/:asset_address/:asset_id/:erc20_address'
示例：
https://pro.fingo.com/_did/admin/add_token/FIN/0x63bb022226e9bab4223583bfd13e74eab8c600b07d/000000000000001600000001/0x63b31fd9128e95479b21bdb34b397bc82e622c61f4
2、增添新交易对
/market_add/:market_id/:base_token_address/:base_token_symbol/:quote_token_address/:quote_token_symbol
示例：
https://pro.fingo.com/_did/admin/market_add/BTC-FIN/0x63086a61a5d0269cb1d6c22a9fc829585fb21fdaa9/BTC/0x63b31fd9128e95479b21bdb34b397bc82e622c61f4/FIN
3、设置时间上线交易对
https://pro.fingo.com/_did/admin/market_up/BTC-FIN/2020-03-06 18:00:01.457

## 在币种都存在的基础上直接上线新币种
1、增添新交易对
https://pro.fingo.com/_did/admin/market_add/ETH-FIN/0x639b93ed84ea37ae3ec9ecffe44dcc7c83c44b5a3a/ETH/0x63b31fd9128e95479b21bdb34b397bc82e622c61f4/FIN
2、设置时间上线交易对
https://pro.fingo.com/_did/admin/market_up/ETH-FIN/2020-03-06 18:02:01.457

https://pro.fingo.com/_did/admin/market_add/ASIM-FIN/0x6345fba46219b9cf6c62e090e5753df302ebfcf374/ASIM/0x63b31fd9128e95479b21bdb34b397bc82e622c61f4/FIN
https://pro.fingo.com/_did/admin/market_up/ASIM-FIN/2020-03-06 18:11:01.457

## 下线新交易对
1、https://pro.fingo.com/_did/admin/market_down/ASIM-FIN/2020-03-03 21:21:01.457






