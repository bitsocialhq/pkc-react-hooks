import { AccountCommunity } from "../../types";
export declare const overwritePlebbitOptions: {
    resolveAuthorAddresses: boolean;
    validatePages: boolean;
};
export declare const getDefaultPlebbitOptions: () => any;
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
        plebbitOptions: any;
        plebbit: any;
        subscriptions: never[];
        blockedAddresses: {};
        blockedCids: {};
        communities: {
            [communityAddress: string]: AccountCommunity;
        };
        mediaIpfsGatewayUrl: string;
    }>;
    getDefaultPlebbitOptions: () => any;
};
export default accountGenerator;
