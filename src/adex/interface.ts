// FIXME： Interface 命名务必加IClassName : IOrder .etc
interface IOrder {
    id: string;
    trader_address: string;
    market_id: string;
    side: string;
    price: number;
    amount: number;
    status: string;
    type: string;
    signature: string;
    available_amount: number;
    confirmed_amount: number;
    canceled_amount: number;
    pending_amount: number;
    expire_at: number;
    updated_at: string;
    created_at: string;
    // ？非数据库的后加字段？
    average_price: string;
    confirm_value: string;
}

interface ITrade {
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


interface IMarket {
    id: string;
    base_token_address: string;
    base_token_symbol: string;
    quote_token_address: string;
    quote_token_symbol: string;
    online: boolean;
    up_at: string;
    down_at: string;
    updated_at: string;
    created_at: string;
}

interface IToken {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    asim_assetid: string;
    asim_address: string;
    created_at: string;
}

interface ITransaction {
    id: string;
    transaction_hash: string;
    market_id: string;
    status: string;
    contract_status: string;
    updated_at: string;
    created_at: string;
}

interface IBridge {
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

interface IPrice {
    price: number;
}

interface IMarketQuotation {
    market_id: string;
    price: number;
    ratio: number;
    volume: number
}

interface IFreezeToken{
    market_id:string;
    side:string;
    base_amount:number;
    quote_amount:number;

}


interface IOrderBook{
    asks:number[][];
    bids:number[][];
}

interface ILastTrade{
    price: number;
    amount: number;
    taker_side: string;
    updated_at: Date;
}

interface IBalance {
    token_symbol: string
    erc20_address: string
    erc20_balance: number
    erc20_freeze_amount: number
    asim_assetid: string
    value: number
    asim_asset_balance?: number
    asset_icon?: string
    coin_icon?: string
    token_icon?: string
}




export {IOrder, ITrade, IToken, IMarket, ITransaction, IBridge, IPrice, IMarketQuotation,IFreezeToken,IOrderBook,ILastTrade,IBalance}


