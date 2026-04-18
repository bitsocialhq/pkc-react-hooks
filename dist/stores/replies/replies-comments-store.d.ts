import { Comments } from "../../types.js";
type RepliesCommentsState = {
    comments: Comments;
    addCommentsToStoreOrUpdateComments: Function;
};
declare const repliesCommentsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RepliesCommentsState>>;
export default repliesCommentsStore;
//# sourceMappingURL=replies-comments-store.d.ts.map