interface ITrade{
    trade_id:string;
    address:string;
    base_asset_name:string;
    base_amount:string;
    base_token_icon?: string;
    price:string;
    quote_asset_name:string;
    quote_amount:string;
    quote_token_icon?: string;
    fee_rate:string;
    fee_token:string;
    fee_amount:string;
    base_txid:string;
    base_tx_status:string;
    quote_txid:string;
    quote_tx_status:string;
    updated_at:string;
    created_at:string;
    [x: string]: any;
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

interface IPoolInfo {
    token_symbol: string
    asim_asset_id: string
    asim_asset_balance: number
    icon: string
}


export {ITrade,IToken, IPoolInfo}
