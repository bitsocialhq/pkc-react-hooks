import { Comment } from "../../types.js";
export declare const flattenCommentsPages: (pageInstanceOrPagesInstance: any) => any[];
export declare const communityPostsCacheExpired: (community: any) => boolean;
export declare const removeInvalidComments: (comments: Comment[], { validateReplies, blockCommunity }: any, pkc: any) => Promise<Comment[]>;
export declare const commentIsValid: (comment: Comment, { validateReplies, blockCommunity }: any | undefined, pkc: any) => Promise<boolean>;
declare const utils: {
    merge: (...args: any) => any;
    clone: (obj: any) => any;
    flattenCommentsPages: (pageInstanceOrPagesInstance: any) => any[];
    memo: (functionToMemo: Function, memoOptions: any) => (...args: any) => Promise<any>;
    memoSync: (functionToMemo: Function, memoOptions: any) => (...args: any) => any;
    retryInfinity: (f: any, o?: any) => any;
    retryInfinityMinTimeout: number;
    retryInfinityMaxTimeout: number;
    clientsOnStateChange: (clients: any, onStateChange: Function) => void;
    pageClientsOnStateChange: (clients: any, onStateChange: Function) => void;
    communityPostsCacheExpired: (community: any) => boolean;
    commentIsValid: (comment: Comment, { validateReplies, blockCommunity }: any | undefined, pkc: any) => Promise<boolean>;
    removeInvalidComments: (comments: Comment[], { validateReplies, blockCommunity }: any, pkc: any) => Promise<Comment[]>;
    repliesAreValid: (comment: Comment, { validateReplies, blockCommunity }: any | undefined, pkc: any) => Promise<boolean>;
};
export default utils;
//# sourceMappingURL=utils.d.ts.map