export default class engine {
    constructor(client: any);
    match(message: any): Promise<any[]>;
    make_trades(find_orders: any, my_order: any): Promise<any[]>;
    call_asimov(trades: any): Promise<void>;
}
