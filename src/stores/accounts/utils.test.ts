import utils from "./utils";
import { Role } from "../../types";
import commentsStore from "../comments";
import repliesPagesStore from "../replies-pages";
import subplebbitsPagesStore from "../subplebbits-pages";
import PlebbitJsModule, { setPlebbitJs, restorePlebbitJs } from "../../lib/plebbit-js";
import PlebbitJsMock from "../../lib/plebbit-js/plebbit-js-mock";

describe("accountsStore utils", () => {
  const author = { address: "author address" };
  const adminRole: Role = { role: "admin" };
  const moderatorRole: Role = { role: "moderator" };

  describe("getAccountSubplebbits", () => {
    test("empty", async () => {
      const account = { author };
      const subplebbits = {};
      const accountSubplebbits = utils.getAccountSubplebbits(account, subplebbits);
      expect(accountSubplebbits).toEqual({});
    });

    test("previous account subplebbits, no new account subplebbits", async () => {
      const previousAccountSubplebbits = {
        subplebbitAddress1: {
          role: adminRole,
        },
      };
      const account = { author, subplebbits: previousAccountSubplebbits };
      const subplebbits = {};
      const accountSubplebbits = utils.getAccountSubplebbits(account, subplebbits);
      expect(accountSubplebbits).toEqual(previousAccountSubplebbits);
    });

    test("subplebbit with roles for other addresses skips author (branch 22)", async () => {
      const account = { author };
      const subplebbits = {
        subplebbitAddress1: {
          roles: {
            "other-address": moderatorRole,
          },
        },
        subplebbitAddress2: {
          roles: {},
        },
      };
      const accountSubplebbits = utils.getAccountSubplebbits(account, subplebbits);
      expect(accountSubplebbits).toEqual({});
    });

    test("no previous account subplebbits, new account subplebbits", async () => {
      const account = { author };
      const subplebbits = {
        subplebbitAddress1: {
          roles: {
            [author.address]: moderatorRole,
          },
        },
        subplebbitAddress2: {
          roles: {
            [author.address]: adminRole,
          },
        },
      };
      const accountSubplebbits = utils.getAccountSubplebbits(account, subplebbits);
      const expectedAccountSubplebbits = {
        subplebbitAddress1: {
          role: moderatorRole,
        },
        subplebbitAddress2: {
          role: adminRole,
        },
      };
      expect(accountSubplebbits).toEqual(expectedAccountSubplebbits);
    });

    test("previous account subplebbits, new account subplebbits", async () => {
      const previousAccountSubplebbits = {
        subplebbitAddress1: {
          role: adminRole,
        },
      };
      const account = { author, subplebbits: previousAccountSubplebbits };
      const subplebbits = {
        subplebbitAddress2: {
          roles: {
            [author.address]: adminRole,
          },
        },
      };
      const accountSubplebbits = utils.getAccountSubplebbits(account, subplebbits);
      const expectedAccountSubplebbits = {
        subplebbitAddress1: {
          role: adminRole,
        },
        subplebbitAddress2: {
          role: adminRole,
        },
      };
      expect(accountSubplebbits).toEqual(expectedAccountSubplebbits);
    });

    test("previous account subplebbits, new account subplebbit overwrites previous", async () => {
      const previousAccountSubplebbits = {
        subplebbitAddress1: {
          role: adminRole,
        },
      };
      const account = { author, subplebbits: previousAccountSubplebbits };
      const subplebbits = {
        subplebbitAddress1: {
          roles: {
            [author.address]: moderatorRole,
          },
        },
        subplebbitAddress2: {
          roles: {
            [author.address]: adminRole,
          },
        },
      };
      const accountSubplebbits = utils.getAccountSubplebbits(account, subplebbits);
      const expectedAccountSubplebbits = {
        subplebbitAddress1: {
          role: moderatorRole,
        },
        subplebbitAddress2: {
          role: adminRole,
        },
      };
      expect(accountSubplebbits).toEqual(expectedAccountSubplebbits);
    });
  });

  describe("getCommentCidsToAccountsComments", () => {
    test("builds map from cids to accountId and accountCommentIndex", () => {
      const accountsComments = {
        acc1: [
          { cid: "cid1", index: 0 },
          { cid: "cid2", index: 1 },
        ],
        acc2: [{ cid: "cid3", index: 0 }],
      };
      const result = utils.getCommentCidsToAccountsComments(accountsComments);
      expect(result).toEqual({
        cid1: { accountId: "acc1", accountCommentIndex: 0 },
        cid2: { accountId: "acc1", accountCommentIndex: 1 },
        cid3: { accountId: "acc2", accountCommentIndex: 0 },
      });
    });
    test("skips account comments without cid", () => {
      const accountsComments = {
        acc1: [
          { cid: null, index: 0 },
          { cid: "cid1", index: 1 },
        ],
      };
      const result = utils.getCommentCidsToAccountsComments(accountsComments);
      expect(result).toEqual({ cid1: { accountId: "acc1", accountCommentIndex: 1 } });
    });
  });

  describe("promiseAny", () => {
    test("rejects when given empty array", async () => {
      await expect(utils.promiseAny([])).rejects.toThrow("all promises rejected");
    });
  });

  describe("fetchCommentLinkDimensions", () => {
    test("returns empty for empty link", async () => {
      expect(await utils.fetchCommentLinkDimensions("")).toEqual({});
      expect(await utils.fetchCommentLinkDimensions(null as any)).toEqual({});
    });

    test("returns empty for non-https protocol", async () => {
      const result = await utils.fetchCommentLinkDimensions("http://example.com/image.png");
      expect(result).toEqual({});
    });

    test("returns image dimensions on image success", async () => {
      const OriginalImage = global.Image;
      (global as any).Image = class MockImage {
        width = 100;
        height = 80;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";
        constructor() {
          setTimeout(() => this.onload?.(), 0);
        }
      };
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/img.png");
        expect(result).toEqual({ linkWidth: 100, linkHeight: 80, linkHtmlTagName: "img" });
      } finally {
        (global as any).Image = OriginalImage;
      }
    });

    test("returns video dimensions on video success", async () => {
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = createElement(tag);
        if (tag === "video") {
          Object.defineProperty(el, "videoWidth", { value: 640 });
          Object.defineProperty(el, "videoHeight", { value: 360 });
          Object.defineProperty(el, "muted", { writable: true, value: true });
          Object.defineProperty(el, "loop", { writable: true, value: false });
          (el as any).pause = () => {};
          setTimeout(() => el.dispatchEvent(new Event("loadeddata")), 0);
        }
        return el;
      }) as any;
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/vid.mp4");
        expect(result).toEqual({ linkWidth: 640, linkHeight: 360, linkHtmlTagName: "video" });
      } finally {
        document.createElement = createElement;
      }
    });

    test("returns audio tag name on audio success", async () => {
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = createElement(tag);
        if (tag === "audio") {
          (el as any).pause = () => {};
          setTimeout(() => el.dispatchEvent(new Event("loadeddata")), 0);
        }
        return el;
      }) as any;
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/audio.mp3");
        expect(result).toEqual({ linkHtmlTagName: "audio" });
      } finally {
        document.createElement = createElement;
      }
    });

    test("rejects zero-dimension video and falls through to audio", async () => {
      const OriginalImage = global.Image;
      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";
        constructor() {
          setTimeout(() => this.onerror?.(), 0);
        }
      };
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = createElement(tag);
        if (tag === "video") {
          Object.defineProperty(el, "videoWidth", { value: 0 });
          Object.defineProperty(el, "videoHeight", { value: 0 });
          (el as any).pause = () => {};
          setTimeout(() => el.dispatchEvent(new Event("loadeddata")), 0);
        }
        if (tag === "audio") {
          (el as any).pause = () => {};
          setTimeout(() => el.dispatchEvent(new Event("loadeddata")), 0);
        }
        return el;
      }) as any;
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/zero-vid.mp4");
        expect(result).toEqual({ linkHtmlTagName: "audio" });
      } finally {
        (global as any).Image = OriginalImage;
        document.createElement = createElement;
      }
    });

    test("rejects zero-dimension image and falls through to video or audio", async () => {
      const OriginalImage = global.Image;
      (global as any).Image = class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";
        constructor() {
          setTimeout(() => this.onload?.(), 0);
        }
      };
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = createElement(tag);
        if (tag === "audio") {
          (el as any).pause = () => {};
          setTimeout(() => el.dispatchEvent(new Event("loadeddata")), 0);
        }
        return el;
      }) as any;
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/zero.png");
        expect(result).toEqual({ linkHtmlTagName: "audio" });
      } finally {
        (global as any).Image = OriginalImage;
        document.createElement = createElement;
      }
    });

    test("handles transport errors and returns empty when all fail", async () => {
      const OriginalImage = global.Image;
      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";
        constructor() {
          setTimeout(() => this.onerror?.(), 0);
        }
      };
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = createElement(tag);
        if (tag === "video" || tag === "audio") {
          setTimeout(() => el.dispatchEvent(new Event("error")), 0);
        }
        return el;
      }) as any;
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/fail.png");
        expect(result).toEqual({});
      } finally {
        (global as any).Image = OriginalImage;
        document.createElement = createElement;
      }
    });

    test("PromiseAny all-rejected returns empty", async () => {
      const OriginalImage = global.Image;
      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";
        constructor() {
          setTimeout(() => this.onerror?.(), 0);
        }
      };
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = createElement(tag);
        if (tag === "video" || tag === "audio") {
          setTimeout(() => el.dispatchEvent(new Event("error")), 0);
        }
        return el;
      }) as any;
      try {
        const result = await utils.fetchCommentLinkDimensions("https://example.com/all-fail.png");
        expect(result).toEqual({});
      } finally {
        (global as any).Image = OriginalImage;
        document.createElement = createElement;
      }
    });

    test("timeout branches when image/video/audio never load", async () => {
      vi.useFakeTimers();
      const OriginalImage = global.Image;
      (global as any).Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = "";
      };
      const createElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => createElement(tag)) as any;
      try {
        const p = utils.fetchCommentLinkDimensions("https://example.com/slow.png");
        await vi.runAllTimersAsync();
        const result = await p;
        expect(result).toEqual({});
      } finally {
        vi.useRealTimers();
        (global as any).Image = OriginalImage;
        document.createElement = createElement;
      }
    }, 10000);
  });

  describe("getInitAccountCommentsToUpdate", () => {
    test("sorts newest-first and caps at 10", () => {
      const accountsComments = {
        acc1: [
          { cid: "c1", timestamp: 100, index: 0 },
          { cid: "c2", timestamp: 300, index: 1 },
          { cid: "c3", timestamp: 200, index: 2 },
        ],
        acc2: [
          { cid: "c4", timestamp: 400, index: 0 },
          { cid: "c5", timestamp: 50, index: 1 },
        ],
      };
      const result = utils.getInitAccountCommentsToUpdate(accountsComments);
      expect(result.map((r) => r.accountComment.timestamp)).toEqual([400, 300, 200, 100, 50]);
      expect(result.length).toBe(5);
    });
    test("caps at 10 when more than 10 comments", () => {
      const comments = Array.from({ length: 15 }, (_, i) => ({
        cid: `c${i}`,
        timestamp: 1000 - i,
        index: i,
      }));
      const accountsComments = { acc1: comments };
      const result = utils.getInitAccountCommentsToUpdate(accountsComments);
      expect(result.length).toBe(10);
      expect(result[0].accountComment.timestamp).toBe(1000);
      expect(result[9].accountComment.timestamp).toBe(991);
    });
  });

  describe("getAccountCommentDepth", () => {
    test("returns 0 when no parentCid", () => {
      expect(utils.getAccountCommentDepth({ parentCid: undefined } as any)).toBe(0);
      expect(utils.getAccountCommentDepth({} as any)).toBe(0);
    });
    test("returns parent depth + 1 when parent in commentsStore", () => {
      commentsStore.setState((s: any) => ({
        comments: { ...s.comments, parentCid1: { cid: "parentCid1", depth: 2 } },
      }));
      try {
        expect(utils.getAccountCommentDepth({ parentCid: "parentCid1" } as any)).toBe(3);
      } finally {
        commentsStore.setState((s: any) => {
          const { parentCid1, ...rest } = s.comments;
          return { comments: rest };
        });
      }
    });
    test("returns parent depth + 1 when parent in repliesPagesStore", () => {
      repliesPagesStore.setState((s: any) => ({
        comments: { ...s.comments, parentCid2: { cid: "parentCid2", depth: 1 } },
      }));
      try {
        expect(utils.getAccountCommentDepth({ parentCid: "parentCid2" } as any)).toBe(2);
      } finally {
        repliesPagesStore.setState((s: any) => {
          const { parentCid2, ...rest } = s.comments;
          return { comments: rest };
        });
      }
    });
    test("returns parent depth + 1 when parent in subplebbitsPagesStore", () => {
      subplebbitsPagesStore.setState((s: any) => ({
        comments: { ...s.comments, parentCid3: { cid: "parentCid3", depth: 0 } },
      }));
      try {
        expect(utils.getAccountCommentDepth({ parentCid: "parentCid3" } as any)).toBe(1);
      } finally {
        subplebbitsPagesStore.setState((s: any) => {
          const { parentCid3, ...rest } = s.comments;
          return { comments: rest };
        });
      }
    });
    test("returns undefined when parent not found (missing-parent fallback)", () => {
      commentsStore.setState((s: any) => ({ comments: s.comments }));
      repliesPagesStore.setState((s: any) => ({ comments: s.comments }));
      subplebbitsPagesStore.setState((s: any) => ({ comments: s.comments }));
      const result = utils.getAccountCommentDepth({ parentCid: "nonexistent" } as any);
      expect(result).toBeUndefined();
    });
  });

  describe("addShortAddressesToAccountComment", () => {
    beforeAll(() => setPlebbitJs(PlebbitJsMock));
    afterAll(() => restorePlebbitJs());

    test("adds shortSubplebbitAddress and author.shortAddress on success", () => {
      const comment = {
        subplebbitAddress: "eip155:0x1234567890abcdef",
        author: { address: "eip155:0xfedcba0987654321" },
      };
      const result = utils.addShortAddressesToAccountComment(comment as any);
      expect(result.shortSubplebbitAddress).toBeDefined();
      expect(result.author.shortAddress).toBeDefined();
      expect(result).not.toBe(comment);
    });
    test("safe-failure when getShortAddress throws", () => {
      const orig = PlebbitJsModule.Plebbit.getShortAddress;
      PlebbitJsModule.Plebbit.getShortAddress = () => {
        throw new Error("mock throw");
      };
      try {
        const comment = {
          subplebbitAddress: "eip155:0x1234567890abcdef",
          author: { address: "eip155:0xfedcba0987654321" },
        };
        const result = utils.addShortAddressesToAccountComment(comment as any);
        expect(result).toBeDefined();
        expect(result.subplebbitAddress).toBe("eip155:0x1234567890abcdef");
        expect(result.shortSubplebbitAddress).toBeUndefined();
      } finally {
        PlebbitJsModule.Plebbit.getShortAddress = orig;
      }
    });
  });
});
