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
create index idx_mist_trades_transaction_hash on mist_trades (transaction_hash);
create index idx_mist_trades_taker on mist_trades (taker,market_id);
create index idx_mist_trades_maker on mist_trades (maker,market_id);
create index idx_mist_market_id_status_executed_at on mist_trades (market_id, status, created_at);

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
create index idx_mist_market_id_status on mist_orders (market_id, status);
create index idx_mist_market_trader_address on mist_orders (trader_address, market_id, status, created_at);

-- transactions table
create table mist_transactions(
  id SERIAL PRIMARY KEY,
  transaction_hash text,
  market_id text ,
  status text ,
  updated_at  timestamp,
  created_at timestamp
);
create unique index idx_mist_transactions_transaction_hash on mist_transactions (transaction_hash);

-- launch_logs table
create table mist_launch_logs(
  id SERIAL PRIMARY KEY,
  status text ,
  transaction_hash text,
  block_number integer,
  t_from text ,
  t_to text ,
  value numeric(32,8),
  updated_at  timestamp,
  created_at  timestamp
);
create index idx_mist_created_at on mist_launch_logs (created_at);
create unique index idx_mist_launch_logs_transaction_hash on mist_launch_logs (transaction_hash);

create table mist_users(
  address text  PRIMARY KEY,
  PI numeric(32,8) default 0,
  ASIM numeric(32,8) default 0,  
  USDT numeric(32,8) default 0,    
  ETH numeric(32,8) default 0,     
  MT numeric(32,8) default 0,    
  BTC numeric(32,8) default 0,
  PI_valuation numeric(32,8) default 0,
  ASIM_valuation numeric(32,8) default 0,  
  USDT_valuation numeric(32,8) default 0,    
  ETH_valuation numeric(32,8) default 0,     
  MT_valuation numeric(32,8) default 0,    
  BTC_valuation numeric(32,8) default 0,
  total_value_1day numeric(32,8) default 0,
  total_value_2day numeric(32,8) default 0,
  total_value_3day numeric(32,8) default 0,
  total_value_4day numeric(32,8) default 0,
  total_value_5day numeric(32,8) default 0,
  total_value_6day numeric(32,8) default 0,
  total_value_7day numeric(32,8) default 0,
  updated_at  timestamp default now(),
  created_at  timestamp default now()
);

create table asim_assets_info(
  id text PRIMARY KEY,
  asset_id text default '',
  asset_name text default '',
  producer text default '',
  total text default '',
  producer_amount text default '' ,
  circulation_amount text default '' ,--circulation_amount + producer_amount = total
  created_at  timestamp default now()
);

create table asim_assets_convert(
  id text PRIMARY KEY,
  address  text default '',
  base_asset_id text default '',
  base_asset_name text default '',
  base_asset_address text default '',
  base_amount numeric(32,8) default 0,
  quote_asset_id text default '',
  quote_asset_name text default '' ,
  quote_asset_address text default '' ,--circulation_amount + producer_amount = total
  quote_amount numeric(32,8) default 0,
  fee_base_amount  numeric(32,8) default 0,
  created_at  timestamp default now()
);


