import { Account, PublishCommentOptions, PublishVoteOptions, PublishCommentEditOptions, PublishCommentModerationOptions, PublishCommunityEditOptions, CreateCommunityOptions } from "../../types";
/** Returns state update or {} when accountComment not yet in state (no-op). Exported for coverage. */
export declare const maybeUpdateAccountComment: (accountsComments: Record<string, any[]>, accountId: string, index: number, updater: (accountComments: any[], accountComment: any) => void) => {
    accountsComments?: undefined;
} | {
    accountsComments: {
        [x: string]: any[];
    };
};
export declare const createAccount: (accountName?: string) => Promise<void>;
export declare const deleteAccount: (accountName?: string) => Promise<void>;
export declare const setActiveAccount: (accountName: string) => Promise<void>;
export declare const setAccount: (account: Account) => Promise<void>;
export declare const setAccountsOrder: (newOrderedAccountNames: string[]) => Promise<void>;
export declare const importAccount: (serializedAccount: string) => Promise<void>;
export declare const exportAccount: (accountName?: string) => Promise<string>;
export declare const subscribe: (communityAddress: string, accountName?: string) => Promise<void>;
export declare const unsubscribe: (communityAddress: string, accountName?: string) => Promise<void>;
export declare const blockAddress: (address: string, accountName?: string) => Promise<void>;
export declare const unblockAddress: (address: string, accountName?: string) => Promise<void>;
export declare const blockCid: (cid: string, accountName?: string) => Promise<void>;
export declare const unblockCid: (cid: string, accountName?: string) => Promise<void>;
export declare const publishComment: (publishCommentOptions: PublishCommentOptions, accountName?: string) => Promise<any>;
export declare const deleteComment: (commentCidOrAccountCommentIndex: string | number, accountName?: string) => Promise<void>;
export declare const publishVote: (publishVoteOptions: PublishVoteOptions, accountName?: string) => Promise<void>;
export declare const publishCommentEdit: (publishCommentEditOptions: PublishCommentEditOptions, accountName?: string) => Promise<void>;
export declare const publishCommentModeration: (publishCommentModerationOptions: PublishCommentModerationOptions, accountName?: string) => Promise<void>;
export declare const publishCommunityEdit: (communityAddress: string, publishCommunityEditOptions: PublishCommunityEditOptions, accountName?: string) => Promise<void>;
export declare const createCommunity: (createCommunityOptions: CreateCommunityOptions, accountName?: string) => Promise<any>;
export declare const deleteCommunity: (communityAddress: string, accountName?: string) => Promise<void>;
