import { UseRepliesOptions, UseRepliesResult } from "../types";
/** Pure helper to append an error to the errors array; used for deterministic coverage of reset/loadMore catch paths. */
export declare function appendErrorToErrors(prevErrors: Error[], e: Error): Error[];
export declare function useReplies(options?: UseRepliesOptions): UseRepliesResult;
