-- tokens table
create table newtokens(
 symbol text primary key,
 address text ,
 decimals integer ,
 created_at timestamp
);
create unique index idx_newtokens_address on newtokens (address);

-- markets table
create table newmarkets(
 id text primary key,
 base_token_address text ,
 base_token_symbol text ,

 quote_token_address text ,
 quote_token_symbol text ,

 created_at timestamp
);

-- trades table
create table newtrades(
  id SERIAL PRIMARY KEY,
  transaction_id integer ,
  transaction_hash text,

  status text ,
  market_id text ,

  maker  text ,
  taker  text ,
  price numeric(32,18) ,
  amount numeric(32,18) ,

  taker_side text ,
  maker_order_id  text ,
  taker_order_id text ,
  created_at timestamp
);
create index idx_newtrades_transaction_hash on newtrades (transaction_hash);
create index idx_newtrades_taker on newtrades (taker,market_id);
create index idx_newtrades_maker on newtrades (maker,market_id);
create index idx_newmarket_id_status_executed_at on trades (market_id, status, create_at);

-- orders table
create table neworders(
  id text  primary key,
  trader_address text ,
  market_id text ,
  side text ,
  price  numeric(32,18) ,
  amount  numeric(32,18) ,
  status text ,
  type text ,
  available_amount  numeric(32,18) ,
  confirmed_amount  numeric(32,18) ,
  canceled_amount  numeric(32,18) ,
  pending_amount  numeric(32,18) ,

  updated_at  timestamp,
  created_at  timestamp
);
create index idx_newmarket_id_status on neworders (market_id, status);
create index idx_newmarket_trader_address on neworders (trader_address, market_id, status, created_at);

-- transactions table
create table newtransactions(
  id SERIAL PRIMARY KEY,
  transaction_hash text,
  market_id text ,
  status text ,
  updated_at  timestamp,
  created_at timestamp
);
create unique index idx_newtransactions_transaction_hash on newtransactions (transaction_hash);

-- launch_logs table
create table newlaunch_logs(
  id SERIAL PRIMARY KEY,
  status text ,
  transaction_hash text,
  block_number integer,
  t_from text ,
  t_to text ,
  value numeric(32,18),
  updated_at  timestamp,
  created_at  timestamp
);
create index idx_newcreated_at on newlaunch_logs (created_at);
create unique index idx_newlaunch_logs_transaction_hash on newlaunch_logs (transaction_hash);
