import { ChainProviders, UseResolvedCommunityAddressOptions, UseResolvedCommunityAddressResult, UseCommunityOptions, UseCommunityResult, UseCommunitiesOptions, UseCommunitiesResult, UseCommunityStatsOptions, UseCommunityStatsResult } from "../types";
/**
 * @param communityAddress - The address of the community, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useCommunity(options?: UseCommunityOptions): UseCommunityResult;
/**
 * @param communityAddress - The address of the community, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useCommunityStats(options?: UseCommunityStatsOptions): UseCommunityStatsResult;
/**
 * @param communityAddresses - The addresses of the communities, e.g. ['memes.eth', '12D3KooWA...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useCommunities(options?: UseCommunitiesOptions): UseCommunitiesResult;
/**
 * Returns all the owner communities created by plebbit-js by calling plebbit.listCommunities()
 */
export declare function useListCommunities(accountName?: string): string[];
/**
 * @param communityAddress - The community address to resolve to a public key, e.g. 'news.eth' resolves to '12D3KooW...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useResolvedCommunityAddress(options?: UseResolvedCommunityAddressOptions): UseResolvedCommunityAddressResult;
export declare const resolveCommunityAddress: (communityAddress: string, chainProviders: ChainProviders) => Promise<any>;
