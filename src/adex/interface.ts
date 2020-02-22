// FIXME： Interface 命名务必加IClassName : IOrder .etc
interface Order {
    id: string;
    trader_address: string;
    market_id: string;
    side: string;
    price: number;
    amount: number;
    status: string;
    type: string;
    available_amount: number;
    confirmed_amount: number;
    canceled_amount: number;
    pending_amount: number;
    updated_at: string;
    created_at: string;
    // ？非数据库的后加字段？
    average_price: string;
    confirm_value: string;
}

interface Trade {
    id: string;
    trade_hash: string;
    transaction_id: number;
    transaction_hash: string;
    status: string;
    market_id: string;
    maker: string;
    taker: string;
    price: number;
    amount: number;
    taker_side: string;
    maker_order_id: string;
    taker_order_id: string;
    updated_at: string;
    created_at: string;
}


interface Market {
    id: string;
    base_token_address: string;
    base_token_symbol: string;
    quote_token_address: string;
    quote_token_symbol: string;
    online: boolean;
    updated_at: string;
    created_at: string;
}

interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    asim_assetid: string;
    asim_address: string;
    created_at: string;
}

interface Transaction {
    id: string;
    transaction_hash: string;
    market_id: string;
    status: string;
    contract_status: string;
    updated_at: string;
    created_at: string;
}

interface Bridge {
    id: string;
    address: string;
    token_name: string;
    amount: number;
    side: string;
    master_txid: string;
    master_txid_status: string;
    child_txid: string;
    child_txid_status: string;
    fee_asset: string;
    fee_amount: string;
    updated_at: string;
    created_at: string;
}

interface Price {
    price: number;
}

interface MarketQuotation {
    market_id: string;
    price: number;
    ratio: number;
    volume: number
}

interface FreezeToken{
    market_id:string;
    side:string;
    base_amount:number;
    quote_amount:number;

}


export {Order, Trade, Token, Market, Transaction, Bridge, Price, MarketQuotation,FreezeToken}
/*
create table asim_assets_info(
    asset_name text PRIMARY KEY,
    asset_id text default '',
    contract_address text default '',
    total text default '',
    yesterday_total text default '',
    updated_at  timestamp default now(),
    created_at  timestamp default now()
);


*/

