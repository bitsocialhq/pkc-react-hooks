import Logger from "@plebbit/plebbit-logger";
export declare const log: Logger;
import { RepliesPages, Comment, Comments } from "../../types";
type RepliesPagesState = {
    repliesPages: RepliesPages;
    comments: Comments;
    addNextRepliesPageToStore: Function;
    addRepliesPageCommentsToStore: Function;
};
declare const repliesPagesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RepliesPagesState>>;
/**
 * Util function to get all pages in the store for a
 * specific comment+sortType using `RepliesPage.nextCid`
 */
export declare const getRepliesPages: (comment: Comment, sortType: string, repliesPages: RepliesPages) => import("../../types").CommunityPage[];
export declare const getRepliesFirstPageCid: (comment: Comment, sortType: string) => any;
export declare const resetRepliesPagesStore: () => Promise<void>;
export declare const resetRepliesPagesDatabaseAndStore: () => Promise<void>;
export default repliesPagesStore;
