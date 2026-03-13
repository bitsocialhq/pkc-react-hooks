import Logger from "@plebbit/plebbit-logger";
export declare const log: Logger;
import { Comments } from "../../types";
export declare const listeners: any;
export type CommentsState = {
    comments: Comments;
    errors: {
        [commentCid: string]: Error[];
    };
    addCommentToStore: Function;
    startCommentAutoUpdate: Function;
    stopCommentAutoUpdate: Function;
    refreshComment: Function;
};
declare const commentsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<CommentsState>>;
export declare const resetCommentsStore: () => Promise<void>;
export declare const resetCommentsDatabaseAndStore: () => Promise<void>;
export default commentsStore;
