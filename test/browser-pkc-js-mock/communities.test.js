import { act } from "@testing-library/react";
import { renderHook } from "../test-utils";
import { useCommunity, setPkcJs, restorePkcJs } from "../../dist";
import debugUtils from "../../dist/lib/debug-utils";
import testUtils from "../../dist/lib/test-utils";
import PkcJsMock from "../../dist/lib/pkc-js/pkc-js-mock";
// mock right after importing or sometimes fails to mock
setPkcJs(PkcJsMock);

const timeout = 10000;
const toCommunity = (name) => (name ? { name } : undefined);

describe("communities (pkc-js mock)", () => {
  beforeAll(async () => {
    console.log("before communities tests");
    testUtils.silenceReactWarnings();
    // reset before or init accounts sometimes fails
    await testUtils.resetDatabasesAndStores();
  });
  afterAll(async () => {
    testUtils.restoreAll();
    await testUtils.resetDatabasesAndStores();
    console.log("after reset stores");
  });

  describe("no communities in database", () => {
    it("get communities one at a time", async () => {
      console.log("starting communities tests");
      const rendered = renderHook((communityAddress) =>
        useCommunity({ community: toCommunity(communityAddress) }),
      );
      const waitFor = testUtils.createWaitFor(rendered, { timeout });

      expect(rendered.result.current?.updatedAt).to.equal(undefined);
      rendered.rerender("community address 1");
      await waitFor(() => typeof rendered.result.current.title === "string");
      expect(rendered.result.current.address).to.equal("community address 1");
      expect(rendered.result.current.title).to.equal("community address 1 title");
      // wait for community.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === "string");
      expect(rendered.result.current.description).to.equal(
        "community address 1 description updated",
      );

      rendered.rerender("community address 2");
      await waitFor(() => typeof rendered.result.current.title === "string");
      expect(rendered.result.current.address).to.equal("community address 2");
      expect(rendered.result.current.title).to.equal("community address 2 title");
      // wait for community.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === "string");
      expect(rendered.result.current.description).to.equal(
        "community address 2 description updated",
      );
    });
  });
});
