export default class CloudBot {
    constructor(market: any, priceOracle: any, amount: any);
    price(): any;
    static login(): Promise<void>;
    start(delay: any): void;
    stop(): void;
    loop(): Promise<void>;
    main(): Promise<void>;
    trade(buy: any): Promise<void>;
    confirmOrder(side: any, price: any, amount: any, address: any, signature: any, order_id: any): Promise<any>;
    signOrder(username: any, order_id: any): Promise<any>;
    buildOrder(side: any, price: any, amount: any, address: any): Promise<any>;
}
