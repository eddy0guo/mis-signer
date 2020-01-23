export default class db {
    constructor();
    my_express(filter_info: any): Promise<any>;
    find_express(trade_id: any): Promise<any>;
    my_express_length(address: any): Promise<any>;
    laucher_pending_trade(): Promise<any>;
    insert_express(info: any): Promise<string | void>;
    update_quote(info: any): Promise<string | void>;
    update_base(info: any): Promise<string | void>;
    get_tokens(filter: any): Promise<any>;
    order_book(filter: any): Promise<any>;
}
