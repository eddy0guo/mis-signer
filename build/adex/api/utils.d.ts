export default class utils {
    constructor();
    arr_values(message: any): any[];
    get_hash(message: any): any;
    get_current_time(): string;
    verify(id: any, sign: any): any;
    get_receipt(txid: any): Promise<any[]>;
    get_receipt_log(txid: any): Promise<"successful" | "failed">;
    orderTobytes(order: any): Promise<any>;
    orderhashbytes(order: any): Promise<unknown>;
    judge_legal_num(num: any): boolean;
    decode_transfer_info(txid: any): Promise<{
        from: any;
        to: any;
        asset_id: any;
        vin_amount: number;
        to_amount: number;
        remain_amount: number;
        fee_amount: number;
        fee_asset: any;
    }>;
    decode_erc20_transfer(txid: any): Promise<{
        contract_address: any;
        from: string;
        to: string;
        amount: number;
    }>;
}
