export default class mist_wallet {
    constructor();
    list_tokens(): Promise<any>;
    get_token(symbol: any): Promise<any>;
    get_token_price2pi(symbol: any): Promise<any>;
    get_token_price2btc(symbol: any): Promise<string | 0>;
}
