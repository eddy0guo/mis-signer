-- tokens table
create table newtokens(
 symbol text primary key,
 address text not null,
 decimals integer not null,
 created_at timestamp
);
create unique index idx_newtokens_address on newtokens (address);

-- markets table
create table newmarkets(
 id text primary key,
 base_token_address text not null,
 base_token_symbol text not null,

 quote_token_address text not null,
 quote_token_symbol text not null,

 created_at timestamp
);

-- trades table
create table newtrades(
  id SERIAL PRIMARY KEY,
  transaction_id integer not null,
  transaction_hash text,

  status text not null,
  market_id text not null,

  maker  text not null,
  taker  text not null,
  price numeric(32,18) not null,
  amount numeric(32,18) not null,

  taker_side text not null,
  maker_order_id  text not null,
  taker_order_id text not null,
  created_at timestamp
);
create index idx_newtrades_transaction_hash on newtrades (transaction_hash);
create index idx_newtrades_taker on newtrades (taker,market_id);
create index idx_newtrades_maker on newtrades (maker,market_id);
create index idx_newmarket_id_status_executed_at on trades (market_id, status, create_at);

-- orders table
create table neworders(
  id text not null primary key,
  trader_address text not null,
  market_id text not null,
  side text not null,
  price  numeric(32,18) not null,
  amount  numeric(32,18) not null,
  status text not null,
  type text not null,
  available_amount  numeric(32,18) not null,
  confirmed_amount  numeric(32,18) not null,
  canceled_amount  numeric(32,18) not null,
  pending_amount  numeric(32,18) not null,

  updated_at  timestamp,
  created_at  timestamp
);
create index idx_newmarket_id_status on neworders (market_id, status);
create index idx_newmarket_trader_address on neworders (trader_address, market_id, status, created_at);

-- transactions table
create table newtransactions(
  id SERIAL PRIMARY KEY,
  transaction_hash text,
  market_id text not null,
  status text not null,
  updated_at  timestamp,
  created_at timestamp
);
create unique index idx_newtransactions_transaction_hash on newtransactions (transaction_hash);

-- launch_logs table
create table newlaunch_logs(
  id SERIAL PRIMARY KEY,
  status text not null,
  transaction_hash text,
  block_number integer,
  t_from text not null,
  t_to text not null,
  value numeric(32,18),
  updated_at  timestamp,
  created_at  timestamp
);
create index idx_newcreated_at on newlaunch_logs (created_at);
create unique index idx_newlaunch_logs_transaction_hash on newlaunch_logs (transaction_hash);
