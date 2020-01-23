export declare const CONSTANT: {
    VERSION: string;
    DEFAULT_PASSWORD: string;
    DEFAULT_SALT: string;
    HTTPTIMEOUT: number;
    CREATEADDRSNUM: number;
    DEFAULT_COIN: {
        name: string;
        coinSlug: string;
        coinName: string;
        coinType: number;
        icon: string;
        addressPrefix: string;
        asset: string;
        unit: string;
        balance: number;
    };
    DEFAULT_ASSET: string;
    COINS: {
        name: string;
        coinSlug: string;
        coinName: string;
        coinType: number;
        icon: string;
        addressPrefix: string;
        asset: string;
        unit: string;
        balance: number;
    }[];
    DEPLOY_CONTRACT_SENDAMOUNT: number;
    DEFAULT_CURRENCY: string;
    CURRENCY_ICON: {
        USD: string;
        EUR: string;
        JPY: string;
        CNY: string;
        GBP: string;
        AUD: string;
        CAD: string;
        CHF: string;
        SEK: string;
        NZD: string;
        MXN: string;
        SGD: string;
        HKD: string;
        NOK: string;
        KRW: string;
    };
    LANGUAGES: {
        language: string;
        shorthand: string;
        icon: string;
    }[];
    MNEMONICLANGUAGES: string[];
    WordListNameDict: {
        en: string;
        zh: string;
    };
    DEFAULT_NETWORK: {
        color: string;
        value: string;
        name: string;
    };
    NETWORKS: {
        color: string;
        value: string;
        name: string;
    }[];
    ASSETINFO_ABI: {
        constant: boolean;
        inputs: {
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
    }[];
    ASSETINFO_ABI_NAME: string;
    CONTRACT_TYPE: {
        NORMAL: string;
        CALL: string;
        CREATE: string;
    };
};
