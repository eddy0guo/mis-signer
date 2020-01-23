export default class order {
    constructor(client: any);
    build(message: any): Promise<void>;
    cancle_order(message: any): Promise<any>;
    list_orders(): Promise<any>;
    my_orders(message: any): Promise<any>;
    my_orders2(address: any, page: any, perpage: any, status1: any, status2: any): Promise<any>;
    my_orders_length(address: any, status1: any, status2: any): Promise<any>;
    order_book(marketID: any): Promise<{
        asks: any[];
        bids: any[];
    }>;
    get_order(order_id: any): Promise<any>;
}
export declare function restore_order(order_id: any, amount: any): Promise<void>;
