-- orders table
create table perpetual_orders(
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

create table perpetual_users(
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

create table perpetual_convert_records(
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
  fee_rate numeric(32,8) default 0,
  fee_token numeric(32,8) default 0,
  fee_amount  numeric(32,8) default 0,
  updated_at  timestamp default now(),
  created_at  timestamp default now()
);

create table perpetual_markets(
 id text primary key,
 base_token_address text ,
 base_token_symbol text ,

 quote_token_address text ,
 quote_token_symbol text ,

 created_at timestamp
);


