import {
  getUpdatedLoadedAndBufferedComments,
  getUpdatedBufferedComments,
  getNextCommentCidToFetchNotFetched,
  toSizes,
  commentsHaveChanged,
} from "./utils";
import commentsStore from "../comments";
import { Comment, Comments, CommentsFilter } from "../../types";
import { setPlebbitJs } from "../..";
import testUtils from "../../lib/test-utils";
import PlebbitJsMock from "../../lib/plebbit-js/plebbit-js-mock";

describe("authors-comments utils", () => {
  beforeAll(async () => {
    setPlebbitJs(PlebbitJsMock);
    await testUtils.resetDatabasesAndStores();
  });

  afterEach(async () => {
    await testUtils.resetDatabasesAndStores();
  });

  describe("commentsHaveChanged", () => {
    it("returns false when same array reference", () => {
      const arr: Comment[] = [{ cid: "c1", timestamp: 1 } as Comment];
      expect(commentsHaveChanged(arr, arr)).toBe(false);
    });

    it("returns true when length differs", () => {
      const a: Comment[] = [{ cid: "c1", timestamp: 1 } as Comment];
      const b: Comment[] = [
        { cid: "c1", timestamp: 1 } as Comment,
        { cid: "c2", timestamp: 2 } as Comment,
      ];
      expect(commentsHaveChanged(a, b)).toBe(true);
    });

    it("returns true when element reference differs", () => {
      const c1 = { cid: "c1", timestamp: 1 } as Comment;
      const c2 = { cid: "c2", timestamp: 2 } as Comment;
      const a: Comment[] = [c1];
      const b: Comment[] = [c2];
      expect(commentsHaveChanged(a, b)).toBe(true);
    });

    it("returns false when same length and same element refs", () => {
      const c1 = { cid: "c1", timestamp: 1 } as Comment;
      const a: Comment[] = [c1];
      const b: Comment[] = [c1];
      expect(commentsHaveChanged(a, b)).toBe(false);
    });
  });

  describe("getUpdatedLoadedAndBufferedComments", () => {
    it("returns same loadedComments reference when commentsHaveChanged is false (same ref)", () => {
      const loaded: Comment[] = [{ cid: "c1", timestamp: 1 } as Comment];
      const buffered: Comment[] = [...loaded];
      const comments: Comments = { c1: loaded[0] };
      const result = getUpdatedLoadedAndBufferedComments(loaded, buffered, 1, undefined, comments);
      expect(result.loadedComments).toBe(loaded);
    });

    it("returns new loadedComments when length differs", () => {
      const loaded: Comment[] = [{ cid: "c1", timestamp: 1 } as Comment];
      const buffered: Comment[] = [
        { cid: "c1", timestamp: 1 } as Comment,
        { cid: "c2", timestamp: 2 } as Comment,
      ];
      const comments: Comments = { c1: loaded[0], c2: buffered[1] };
      const result = getUpdatedLoadedAndBufferedComments(loaded, buffered, 2, undefined, comments);
      expect(result.loadedComments).not.toBe(loaded);
      expect(result.loadedComments.length).toBe(2);
    });

    it("returns new loadedComments when element differs", () => {
      const c1 = { cid: "c1", timestamp: 1 } as Comment;
      const c2 = { cid: "c2", timestamp: 2 } as Comment;
      const loaded: Comment[] = [c1];
      const buffered: Comment[] = [c1, c2];
      const comments: Comments = { c1, c2 };
      const result = getUpdatedLoadedAndBufferedComments(loaded, buffered, 1, undefined, comments);
      expect(result.loadedComments).not.toBe(loaded);
    });

    it("filters buffered comments when filter is provided", () => {
      const c1 = { cid: "c1", timestamp: 1 } as Comment;
      const c2 = { cid: "c2", timestamp: 2 } as Comment;
      const c3 = { cid: "c3", timestamp: 3 } as Comment;
      const loaded: Comment[] = [c1];
      const buffered: Comment[] = [c1, c2, c3];
      const filter: CommentsFilter = {
        filter: (c) => c.cid !== "c2",
        key: "exclude-c2",
      };
      const comments: Comments = { c1, c2, c3 };
      const result = getUpdatedLoadedAndBufferedComments(loaded, buffered, 1, filter, comments);
      expect(result.bufferedComments.map((c) => c.cid)).toEqual(["c1", "c3"]);
    });

    it("returns new loadedComments when same length but element reference differs (comments store updated)", () => {
      const c1 = { cid: "c1", timestamp: 1 } as Comment;
      const c1Updated = { ...c1, content: "updated" };
      const loaded: Comment[] = [c1];
      const buffered: Comment[] = [c1];
      const comments: Comments = { c1: c1Updated };
      const result = getUpdatedLoadedAndBufferedComments(loaded, buffered, 1, undefined, comments);
      expect(result.loadedComments).not.toBe(loaded);
      expect(result.loadedComments[0]).toBe(c1Updated);
    });
  });

  describe("getNextCommentCidToFetchNotFetched", () => {
    it("returns undefined when nextCommentCidToFetch is undefined", () => {
      expect(getNextCommentCidToFetchNotFetched(undefined)).toBe(undefined);
    });

    it("returns cid when comment not in store", () => {
      expect(getNextCommentCidToFetchNotFetched("nonexistent-cid")).toBe("nonexistent-cid");
    });

    it("throws on infinite loop when comments form cycle", () => {
      const cid1 = "cycle-cid-1";
      const cid2 = "cycle-cid-2";
      commentsStore.setState((s) => ({
        comments: {
          ...s.comments,
          [cid1]: {
            cid: cid1,
            timestamp: 1,
            author: { previousCommentCid: cid2 },
          } as Comment,
          [cid2]: {
            cid: cid2,
            timestamp: 2,
            author: { previousCommentCid: cid1 },
          } as Comment,
        },
      }));
      expect(() => getNextCommentCidToFetchNotFetched(cid1, 3)).toThrow("infinite loop");
    });
  });

  describe("toSizes", () => {
    it("uses length for arrays", () => {
      expect(toSizes({ a: [1, 2], b: [] })).toEqual({ a: 2, b: 0 });
    });

    it("uses size for Sets", () => {
      expect(toSizes({ a: new Set([1, 2, 3]) })).toEqual({ a: 3 });
    });

    it("prefers length over size when both exist", () => {
      const arrLike = { length: 5, size: 10 };
      expect(toSizes({ a: arrLike })).toEqual({ a: 5 });
    });
  });
});
