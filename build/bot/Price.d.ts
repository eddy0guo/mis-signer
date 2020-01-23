export default class Price {
    constructor(initPrices: any);
    start(): void;
    stop(): void;
    getPrice(market: any): any;
    loop(): Promise<void>;
    updatePrice(): Promise<void>;
}
