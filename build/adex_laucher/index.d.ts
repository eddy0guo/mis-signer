declare class launcher {
    private db;
    private utils;
    private block_height;
    private tmp_transaction_id;
    constructor();
    start(): Promise<void>;
    loop(): Promise<void>;
}
declare const _default: launcher;
export default _default;
