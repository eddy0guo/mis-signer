create table mist_borrows(
 id text primary key,
 address text,
 deposit_assetID integer,
 deposit_amount numeric(32,8),
 deposit_token_name text,
 deposit_price numeric(32,8), ---btc-60000
 interest_rate numeric(32,8),--利息的率
 cdp_id integer, 
 status text, --achive or borrowing
 zhiya_rate numeric(32,8), ---质押率=抵押的价值/借到的钱
 usage text,---用途
 borrow_amount numeric(32,8),
 borrow_time integer,
 updated_at timestamp,
 created_at timestamp
);
