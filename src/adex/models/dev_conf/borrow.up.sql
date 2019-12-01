create table mist_borrows(
 id text primary key,
 address text,
 deposit_assetID text,
 deposit_amount numeric(32,18),
 deposit_token_name text,
 deposit_price numeric(32,18), ---btc-60000
 interest_rate numeric(32,18),--利息的率
 cdp_id integer, 
 status text, --achive or borrowing
 zhiya_rate numeric(32,18), ---质押率=抵押的价值/借到的钱
 usage text,---用途
 borrow_amount numeric(32,18),
 borrow_time integer,
 repaid_amount numeric(32,18),--增加已经偿还数量
 should_repaid_amount numeric(32,18),--到期应还
 cdp_address text,--到期应还
 updated_at timestamp,
 created_at timestamp
);

create table mist_cdp_info(
 token_name text primary key,
 cdp_address text,
 token_asset_id text,
 init_price numeric(32,18),
 min_zhiya_rate numeric(32,18), ---最小质押率
 day30_interest_rate  numeric(32,18),
 day60_interest_rate  numeric(32,18),
 day90_interest_rate  numeric(32,18),
 day180_interest_rate  numeric(32,18),
 day360_interest_rate  numeric(32,18),
 updated_at timestamp,
 created_at timestamp
);

create table mist_token_convert(
 id text primary key,
 address text,
 asim_token_name text,
 erc20_totken_name text,

 side text,--coin2asset,asset2coin

 asim_token_contract text,
 asim_token_id text,
 erc20_token_contract text,

 status text,--failed,success
 txid text,
 amount numeric(32,8),
 fee_token text,
 fee_token_amount numeric(32,8),
 created_at timestamp
);


