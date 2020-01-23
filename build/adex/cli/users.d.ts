export default class users {
    private db;
    private utils;
    private mist_wallet;
    private logger;
    private exchange;
    constructor(client?: any, logger?: any);
    start(): Promise<void>;
    get_total_balance(token_info: any, user_address: any): Promise<number>;
    loop_token(): Promise<void>;
    loop_total(): Promise<void>;
}
