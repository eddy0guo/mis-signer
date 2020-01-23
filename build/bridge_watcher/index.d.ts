declare class watcher {
    private psql_db;
    private utils;
    constructor();
    start(): Promise<void>;
    asset2coin_loop(): Promise<void>;
    coin2asset_release_loop(): Promise<void>;
    coin2asset_burn_loop(): Promise<void>;
}
declare const _default: watcher;
export default _default;
