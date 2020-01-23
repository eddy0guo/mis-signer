declare const _default: {
    get(key: any): Promise<unknown>;
    set(key: any, data: any): Promise<unknown>;
    remove(key: any): Promise<unknown>;
    clear(): Promise<unknown>;
    setKeypair(data: any): any;
    getKeypair(): any;
    removeKeypair(): any;
    setPubKeys(data: any): any;
    getPubKeys(): any;
    removePubKeys(): any;
};
export default _default;
