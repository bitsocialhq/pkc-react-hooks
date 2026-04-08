import { act } from "@testing-library/react";
import { renderHook } from "../test-utils";
import { useComment, setPkcJs, restorePkcJs } from "../../dist";
import debugUtils from "../../dist/lib/debug-utils";
import testUtils from "../../dist/lib/test-utils";
import PkcJsMock from "../../dist/lib/pkc-js/pkc-js-mock";
// mock right after importing or sometimes fails to mock
setPkcJs(PkcJsMock);

const timeout = 2000;

describe("comments (pkc-js mock)", () => {
  beforeAll(async () => {
    console.log("before comments tests");
    testUtils.silenceReactWarnings();
    // reset before or init accounts sometimes fails
    await testUtils.resetDatabasesAndStores();
  });
  afterAll(async () => {
    testUtils.restoreAll();
    await testUtils.resetDatabasesAndStores();
    console.log("after reset stores");
  });

  describe("no comments in database", () => {
    it("get comments one at a time", async () => {
      console.log("starting comments tests");
      const rendered = renderHook((commentCid) => useComment({ commentCid }));
      const waitFor = testUtils.createWaitFor(rendered, { timeout });
      expect(rendered.result.current?.timestamp).to.equal(undefined);

      rendered.rerender("comment cid 1");
      await waitFor(() => typeof rendered.result.current?.timestamp === "number");
      expect(typeof rendered.result.current?.timestamp).to.equal("number");
      expect(rendered.result.current?.cid).to.equal("comment cid 1");
      // wait for comment.on('update') to fetch the ipns
      await waitFor(
        () =>
          typeof rendered.result.current?.cid === "string" &&
          typeof rendered.result.current?.upvoteCount === "number",
      );
      expect(rendered.result.current?.cid).to.equal("comment cid 1");
      expect(rendered.result.current?.upvoteCount).to.equal(3);

      rendered.rerender("comment cid 2");
      // wait for addCommentToStore action
      await waitFor(() => typeof rendered.result.current?.timestamp === "number");
      expect(typeof rendered.result.current?.timestamp).to.equal("number");
      expect(rendered.result.current?.cid).to.equal("comment cid 2");
    });
  });
});
