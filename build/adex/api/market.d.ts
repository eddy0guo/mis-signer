export default class makets {
    constructor();
    list_markets(): Promise<any>;
    get_market(market_id: any): Promise<any>;
    list_market_quotations(): Promise<any[]>;
}
