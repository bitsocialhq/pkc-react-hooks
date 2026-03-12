import { Account, Communities, AccountComment, AccountsComments, CommentCidsToAccountsComments, Comment } from "../../types";
export declare const getAccountCommunities: (account: Account, communities: Communities) => any;
export declare const getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
interface CommentLinkDimensions {
    linkWidth?: number;
    linkHeight?: number;
    linkHtmlTagName?: "img" | "video" | "audio";
}
export declare const fetchCommentLinkDimensions: (link: string) => Promise<CommentLinkDimensions>;
export declare const getInitAccountCommentsToUpdate: (accountsComments: AccountsComments) => {
    accountComment: AccountComment;
    accountId: string;
}[];
export declare const getAccountCommentDepth: (comment: Comment) => number | undefined;
export declare const addShortAddressesToAccountComment: (comment: Comment) => Comment;
declare const utils: {
    getAccountCommunities: (account: Account, communities: Communities) => any;
    getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
    fetchCommentLinkDimensions: (link: string) => Promise<CommentLinkDimensions>;
    getInitAccountCommentsToUpdate: (accountsComments: AccountsComments) => {
        accountComment: AccountComment;
        accountId: string;
    }[];
    getAccountCommentDepth: (comment: Comment) => number | undefined;
    addShortAddressesToAccountComment: (comment: Comment) => Comment;
    promiseAny: <T>(promises: Promise<T>[]) => Promise<T>;
};
export default utils;
