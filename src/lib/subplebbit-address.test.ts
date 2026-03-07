import { areEquivalentSubplebbitAddresses, normalizeEthAliasDomain } from "./subplebbit-address";

describe("subplebbit-address", () => {
  test("treats .eth and .bso aliases as equivalent", () => {
    expect(areEquivalentSubplebbitAddresses("music-posting.eth", "music-posting.bso")).toBe(true);
    expect(areEquivalentSubplebbitAddresses("music-posting.bso", "music-posting.eth")).toBe(true);
  });

  test("matches aliases case-insensitively", () => {
    expect(areEquivalentSubplebbitAddresses("Music-Posting.ETH", "music-posting.bso")).toBe(true);
  });

  test("does not treat different names as equivalent", () => {
    expect(areEquivalentSubplebbitAddresses("music-posting.eth", "other-posting.bso")).toBe(false);
  });

  test("normalizes .bso aliases to .eth", () => {
    expect(normalizeEthAliasDomain("music-posting.bso")).toBe("music-posting.eth");
    expect(normalizeEthAliasDomain("music-posting.eth")).toBe("music-posting.eth");
  });
});
