import { AccountCommunity, ChainProviders } from "../../types";
export declare const overwritePkcOptions: {
    resolveAuthorNames: boolean;
    resolveAuthorAddresses: boolean;
    validatePages: boolean;
};
export declare const getDefaultChainProviders: () => ChainProviders;
export declare const getDefaultPkcOptions: () => {
    resolveAuthorNames: any;
    resolveAuthorAddresses: any;
};
declare const accountGenerator: {
    generateDefaultAccount: () => Promise<{
        id: string;
        version: number;
        name: string;
        author: {
            address: any;
            wallets: {
                eth: {
                    address: string;
                    timestamp: number;
                    signature: {
                        signature: string;
                        type: string;
                    };
                } | undefined;
            };
        };
        signer: any;
        chainProviders: ChainProviders;
        pkcOptions: {
            resolveAuthorNames: any;
            resolveAuthorAddresses: any;
        };
        subscriptions: never[];
        blockedAddresses: {};
        blockedCids: {};
        communities: {
            [communityAddress: string]: AccountCommunity;
        };
        mediaIpfsGatewayUrl: string;
    }>;
    getDefaultPkcOptions: () => {
        resolveAuthorNames: any;
        resolveAuthorAddresses: any;
    };
};
export default accountGenerator;
