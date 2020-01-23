declare class watcher {
    private psql_db;
    private utils;
    constructor();
    start(): Promise<void>;
    loop(): Promise<void>;
}
declare const _default: watcher;
export default _default;
