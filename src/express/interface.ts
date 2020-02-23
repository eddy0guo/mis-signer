interface Trade{
    trade_id:string;
    address:string;
    base_asset_name:string;
    base_amount:string;
    price:string;
    quote_asset_name:string;
    quote_amount:string;
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

interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    asim_assetid: string;
    asim_address: string;
    created_at: string;
}

export {Trade,Token}
