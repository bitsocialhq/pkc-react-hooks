export declare const getProtocolClient: (account: any) => any;
export declare const getProtocolOptions: (account: any) => any;
export declare const getChainProviders: (account: any) => any;
export declare const getNameResolversChainProviders: (account: any) => any;
export declare const getRpcClients: (protocolClient: any) => any;
export declare const getPageRpcClients: (clients: any) => any;
export declare const getProtocolNameResolverClients: (protocolClient: any) => any;
export type NameResolverInfo = {
    key: string;
    nameSystem: string;
    chainTicker: string;
    provider: string;
    providerLabel: string;
};
export declare const getConfiguredNameResolverInfoByKey: (account: any) => Record<string, NameResolverInfo>;
export declare const getMatchingNameResolvers: (account: any, address?: string) => NameResolverInfo[];
export declare const resolveAuthorNameWithProtocol: (protocolClient: any, options: {
    address?: string;
} | Record<string, any>) => any;
export declare const normalizeOptionsForPkcClient: <T extends Record<string, any> | undefined>(options: T) => T;
export declare const getPkcClientOptions: <T extends Record<string, any> | undefined>(account: any, options: T) => T;
export declare const normalizeAccountProtocolConfig: <T extends Record<string, any> | undefined>(account: T, defaultChainProviders?: Record<string, any>) => T;
export declare const withProtocolAliases: <T extends Record<string, any>>(account: T, protocolClient?: any, protocolOptions?: any) => T;
export * from "./protocol-compat";
