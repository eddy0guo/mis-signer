create table asim_express_records(
  trade_id text PRIMARY KEY,

  address text default '',
  base_asset_name text default '',
  base_amount numeric(32,8) default 0,


  price numeric(32,8) default 0, --basetoken2pi / quotetoken2pi
  quote_asset_name text default '' ,
  quote_amount numeric(32,8) default 0,

  fee_rate numeric(32,8) default 0,
  fee_token text default '',
  fee_amount  numeric(32,8) default 0,

  base_txid text default '',
  base_tx_status  text default '',
  quote_txid text default '',
  quote_tx_status text default '',

  updated_at  timestamp default now(),
  created_at  timestamp default now()
);
create index idx_asim_express_my_express on asim_express_records (address,created_at);
create index idx_asim_express_pending_trade on asim_express_records (base_tx_status,quote_tx_status,created_at);
