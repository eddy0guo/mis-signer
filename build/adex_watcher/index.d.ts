declare class watcher {
    private db;
    private utils;
    private block_height;
    constructor();
    start(): Promise<void>;
    loop(): Promise<void>;
}
declare const _default: watcher;
export default _default;
