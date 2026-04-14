import { act } from "@testing-library/react";
import { renderHook } from "../test-utils";
import { useFeed, setPkcJs, restorePkcJs } from "../../dist";
import debugUtils from "../../dist/lib/debug-utils";
import PkcJsMock from "../../dist/lib/pkc-js/pkc-js-mock";
// mock right after importing or sometimes fails to mock
setPkcJs(PkcJsMock);
import testUtils from "../../dist/lib/test-utils";

const timeout = 10000;
const toCommunities = (names) => names?.map((name) => ({ name }));

describe("feeds (pkc-js mock)", () => {
  beforeAll(async () => {
    console.log("before feeds tests");
    testUtils.silenceReactWarnings();
    // reset before or init accounts sometimes fails
    await testUtils.resetDatabasesAndStores();
  });
  afterAll(async () => {
    testUtils.restoreAll();
    await testUtils.resetDatabasesAndStores();
    console.log("after reset stores");
  });

  describe("get feed", () => {
    // reddit infinite scrolling posts per pages are 25
    const postsPerPage = 25;
    let rendered;
    let waitFor;

    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + postsPerPage;
      act(() => {
        rendered.result.current.loadMore();
      });
      await waitFor(() => rendered.result.current.feed?.length >= nextFeedLength);
    };

    beforeEach(async () => {
      rendered = renderHook((props) => useFeed(props));
      waitFor = testUtils.createWaitFor(rendered, { timeout });
    });

    it("get feed with no arguments", async () => {
      console.log("starting feeds tests");
      expect(rendered.result.current.feed).to.deep.equal([]);
      expect(typeof rendered.result.current.hasMore).to.equal("boolean");
      expect(typeof rendered.result.current.loadMore).to.equal("function");
    });

    it("get feed page 1 with 1 community sorted by default (hot)", async () => {
      // get feed with 1 sub
      rendered.rerender({ communities: toCommunities(["community address 1"]) });
      // initial state
      expect(typeof rendered.result.current.hasMore).to.equal("boolean");
      expect(typeof rendered.result.current.loadMore).to.equal("function");

      // wait for feed array to render
      await waitFor(() => Array.isArray(rendered.result.current.feed));
      expect(rendered.result.current.feed).to.deep.equal([]);

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0);
      // NOTE: the 'hot' sort type uses timestamps and bugs out with timestamp '100-1' so this is why we get cid 100
      // with low upvote count first
      expect(rendered.result.current.feed[0].cid).to.equal(
        "community address 1 page cid hot comment cid 100",
      );
      expect(rendered.result.current.feed.length).to.equal(postsPerPage);
    });

    it("change community addresses and sort type", async () => {
      rendered.rerender({ communities: toCommunities(["community address 1"]), sortType: "hot" });
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/community address 1/));
      expect(rendered.result.current.feed[0].cid).to.match(/community address 1/);
      expect(rendered.result.current.feed.length).to.equal(postsPerPage);

      // change community addresses
      rendered.rerender({
        communities: toCommunities(["community address 2", "community address 3"]),
        sortType: "hot",
      });
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/community address (2|3)/));
      expect(rendered.result.current.feed[0].cid).to.match(/community address (2|3)/);
      // the 'hot' sort type should give timestamp 1 with the current mock
      expect(rendered.result.current.feed[0].timestamp).to.equal(100);
      expect(rendered.result.current.feed.length).to.equal(postsPerPage);

      // change sort type
      rendered.rerender({
        communities: toCommunities(["community address 2", "community address 3"]),
        sortType: "new",
      });
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/community address (2|3)/));
      expect(rendered.result.current.feed[0].cid).to.match(/community address (2|3)/);
      // the 'new' sort type should give timestamp higher than 99 with the current mock
      expect(rendered.result.current.feed[0].timestamp).to.be.greaterThan(99);
      expect(rendered.result.current.feed.length).to.equal(postsPerPage);

      // change community addresses and sort type
      rendered.rerender({
        communities: toCommunities(["community address 4", "community address 5"]),
        sortType: "topAll",
      });
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/community address (4|5)/));
      expect(rendered.result.current.feed[0].cid).to.match(/community address (4|5)/);
      expect(rendered.result.current.feed.length).to.equal(postsPerPage);
    });

    it("get feed with 1 community and scroll to multiple pages", async () => {
      // get feed with 1 sub
      rendered.rerender({ communities: toCommunities(["community address 1"]) });
      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0);

      let pages = 20;
      let currentPage = 1;
      while (currentPage++ < pages) {
        // load 25 more posts
        act(() => {
          rendered.result.current.loadMore();
        });
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage);
        expect(rendered.result.current.feed.length).to.equal(postsPerPage * currentPage);
      }
    });

    // use this as stress test
    it.skip("(long stress test) get feed with 25 community and scroll to 1000 pages", async () => {
      const communityAddresses = [];
      while (communityAddresses.length < 25) {
        communityAddresses.push(`community address ${communityAddresses.length + 1}`);
      }
      rendered.rerender({ communities: toCommunities(communityAddresses) });
      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0);

      let pages = 1000;
      let currentPage = 1;
      while (currentPage++ < pages) {
        console.log("page", currentPage);
        console.log("feed length", rendered.result.current.feed.length);
        // load 25 more posts
        act(() => {
          rendered.result.current.loadMore();
        });
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage);
        expect(rendered.result.current.feed.length).to.equal(postsPerPage * currentPage);
      }
    });
  });
});
