-- tokens table
create table mist_tokens(
 symbol text primary key,
 name text,
 address text ,
 decimals integer ,
 asim_assetID text ,
 asim_address text ,
 created_at timestamp
);
create unique index idx_mist_tokens_address on mist_tokens (address);

-- markets table
create table mist_markets(
 id text primary key,
 base_token_address text ,
 base_token_symbol text ,
 quote_token_address text ,
 quote_token_symbol text ,
 online  boolean ,
 up_at  timestamp ,
 down_at  timestamp ,
 updated_at timestamp ,
 created_at timestamp
);

-- trades table
create table mist_trades(
  id text PRIMARY KEY,
  trade_hash text,
  transaction_id integer ,
  transaction_hash text,
  status text ,
  market_id text ,
  maker  text ,
  taker  text ,
  price numeric(32,8) ,
  amount numeric(32,8) ,
  taker_side text ,
  maker_order_id  text ,
  taker_order_id text ,
  updated_at timestamp ,
  created_at timestamp
);
create index idx_mist_trades_taker on mist_trades (taker);
create index idx_mist_trades_maker on mist_trades (maker);
create index idx_mist_trades_taker_order_id  on mist_trades (taker_order_id);
create index idx_mist_trades_maker_order_id on mist_trades (maker_order_id);
create index idx_mist_trades_transaction_id on mist_trades (transaction_id);
create index idx_mist_trades_quotation  on mist_trades (market_id, created_at);

create table mist_trades_tmp(
  id text PRIMARY KEY,
  trade_hash text,
  transaction_id integer ,
  transaction_hash text,
  status text ,
  market_id text ,
  maker  text ,
  taker  text ,
  price numeric(32,8) ,
  amount numeric(32,8) ,
  taker_side text ,
  maker_order_id  text ,
  taker_order_id text ,
  updated_at timestamp ,
  created_at timestamp
);
create index idx_mist_trades_tmp_quotation on mist_trades_tmp (market_id,created_at);
create index idx_mist_trades_tmp_recent on mist_trades_tmp (market_id);
create index idx_mist_trades_tmp_launch on mist_trades_tmp (created_at,status);
create index idx_mist_trades_tmp_status on mist_trades_tmp (status);
create index idx_mist_trades_tmp_txid on mist_trades_tmp (transaction_id);
create index idx_mist_trades_tmp_txhash on mist_trades_tmp (transaction_hash,status);

-- orders table
create table mist_orders(
  id text  primary key,
  trader_address text ,
  market_id text ,
  side text ,
  price  numeric(32,8) ,
  amount  numeric(32,8) ,
  status text ,
  type text ,
  available_amount  numeric(32,8) ,
  confirmed_amount  numeric(32,8) ,
  canceled_amount  numeric(32,8) ,
  pending_amount  numeric(32,8) ,

  updated_at  timestamp,
  created_at  timestamp
);
create index idx_mist_myorders_v3 on mist_orders (trader_address, market_id,status,updated_at);
create index idx_mist_myorders_v2 on mist_orders (trader_address,status,updated_at);

create table mist_orders_tmp(
  id text  primary key,
  trader_address text ,
  market_id text ,
  side text ,
  price  numeric(32,8) ,
  amount  numeric(32,8) ,
  status text ,
  type text ,
  available_amount  numeric(32,8) ,
  confirmed_amount  numeric(32,8) ,
  canceled_amount  numeric(32,8) ,
  pending_amount  numeric(32,8) ,

  updated_at  timestamp,
  created_at  timestamp
);

create index  idx_mist_orders_tmp_matche on mist_orders_tmp (market_id, side, price, available_amount);
create index  idx_mist_orders_tmp_orderbook on mist_orders_tmp (market_id, available_amount, side);
create index  idx_mist_orders_tmp_address on mist_orders_tmp (trader_address,status);

-- transactions table
create table mist_transactions(
  id SERIAL PRIMARY KEY,
  transaction_hash text,
  market_id text ,
  status text ,
  contract_status text ,
  updated_at  timestamp,
  created_at timestamp
);
create unique index idx_mist_transactions_pendingTX on mist_transactions (created_at,status,transaction_hash,id);

create table mist_bridge(
  id text PRIMARY KEY,
  address  text default '',
  token_name text default '',
  amount numeric(32,8) default 0,
  side  text default '', --asset2coin,coin2asset
  master_txid text default '',
  master_txid_status text default '',
  child_txid  text default '',
  child_txid_status  text default '',
  fee_asset  text default '', ---提现和充值的时候在master侧扣钱
  fee_amount  text default '',
  updated_at  timestamp default now(),
  created_at  timestamp default now()
);

create index idx_mist_bridge_pending_decode on mist_bridge (address,master_txid_status,created_at);
create index idx_mist_bridge_my_bridge on mist_bridge (address,created_at);
create index idx_mist_bridge_pending_trade on mist_bridge (side,master_txid_status,child_txid_status,created_at);



create table mist_market_quotation_tmp(
  market_id text PRIMARY KEY,
  price  numeric(32,8) default 0,
  ratio  numeric(32,8) default 0,
  volume numeric(32,8) default 0,
  CNYC_price numeric(32,8) default 0,
  maxprice numeric(32,8) default 0,
  minprice numeric(32,8) default 0,
  min_CNYC_price numeric(32,8) default 0,
  max_CNYC_price numeric(32,8) default 0,
  symbol  text default '',
  updated_at  timestamp default now(),
  created_at  timestamp default now()
);

create table mist_order_book_tmp(
  market_id text default 0,
  precision  int default 0,
  order_book text default '',
  updated_at  timestamp default now(),
  created_at  timestamp default now()
);

