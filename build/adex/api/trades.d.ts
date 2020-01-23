export default class trades {
    constructor(client: any);
    get_engine_info(): Promise<any>;
    list_trades(marketID: any): Promise<any>;
    my_trades_length(address: any): Promise<any>;
    my_trades(message: any): Promise<any>;
    my_trades2(address: any, page: any, perpage: any): Promise<any>;
    trading_view(message: any): Promise<any[]>;
    rollback_trades(): Promise<void>;
}
