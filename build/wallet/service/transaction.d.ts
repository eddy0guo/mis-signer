export declare const TranService: {
    queryAllSendTransaction(addrs: any, offset: any, count: any): Promise<Error>;
    queryTransactionsByAddresses(addrs: any, offset: any, count: any): Promise<any[]>;
    querySendTransaction(addrs: any, offset?: number, count?: number): Promise<{}[]>;
    queryBalances(addrs: any): Promise<any[] | import("axios").AxiosResponse<any>>;
    queryUTXO(addrs: any, assetKey: any): Promise<import("axios").AxiosResponse<any>>;
    queryBalance(addr: any): Promise<import("axios").AxiosResponse<any>>;
    decodeRawTx(rawTxs: any): Promise<any>;
    chooseUTXO(walletId: any, assetObjArr: any, addr?: string): Promise<{
        ins: any[];
        changeOut: any[];
    }>;
    chooseUTXO_V2(walletId: any, assetObjArr: any, addr?: string): Promise<{
        ins: any[];
        changeOut: any[];
    }>;
    generateRawTx(inputs: any, outputs: any, keys: any, gasLimit?: number): any;
    generateTxHex(inputs: any, outputs: any, keys: any, gasLimit?: number): any;
    signHex(keys: any, hex: any): any;
};
