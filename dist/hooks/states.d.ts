import { UseClientsStatesOptions, UseClientsStatesResult, UseCommunitiesStatesOptions, UseCommunitiesStatesResult } from "../types";
/**
 * @param comment - The comment to get the states from
 * @param community - The community to get the states from
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useClientsStates(options?: UseClientsStatesOptions): UseClientsStatesResult;
/**
 * @param communityAddresses - The community addresses to get the states from
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useCommunitiesStates(options?: UseCommunitiesStatesOptions): UseCommunitiesStatesResult;
