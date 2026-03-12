import { Account, Comment, Community } from "../../types";
export declare const startUpdatingAccountCommentOnCommentUpdateEvents: (comment: Comment, account: Account, accountCommentIndex: number) => Promise<void>;
export declare const addCidToAccountComment: (comment: Comment) => Promise<void>;
export declare const markNotificationsAsRead: (account: Account) => Promise<void>;
export declare const addCommunityRoleToAccountsCommunities: (community: Community) => Promise<void>;
