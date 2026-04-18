import { Account, Comment, Community } from "../../types.js";
export declare const startUpdatingAccountCommentOnCommentUpdateEvents: (comment: Comment, account: Account, accountCommentIndex: number) => Promise<void>;
export declare const addCidToAccountComment: (comment: Comment) => Promise<void>;
export declare const ensureAccountEditsLoaded: (accountId: string) => Promise<void>;
export declare const resetLazyAccountHistoryLoaders: () => void;
export declare const markNotificationsAsRead: (account: Account) => Promise<void>;
export declare const addCommunityRoleToAccountsCommunities: (community: Community) => Promise<void>;
//# sourceMappingURL=accounts-actions-internal.d.ts.map