const pkcMock = vi.hoisted(() => {
  const pkc: any = vi.fn(async () => ({}));
  pkc.getShortAddress = vi.fn(({ name }: { name?: string }) => `short:${name}`);
  return { pkc };
});

vi.mock("@pkcprotocol/pkc-js", () => ({ default: pkcMock.pkc }));

import PkcJs, { restorePkcJs } from "./index";

describe("pkc-js adapter", () => {
  beforeEach(() => {
    pkcMock.pkc.mockClear();
    pkcMock.pkc.getShortAddress.mockClear();
    restorePkcJs();
  });

  test("normalizes address params for pkc-js getShortAddress", async () => {
    const address = "12D3KooWMZPQsQdYtrakc4D1XtzGXwN1X3DBnAobcCjcPYYXTB6o";

    await PkcJs.PKC();

    expect(PkcJs.PKC.getShortAddress({ address })).toBe(`short:${address}`);
    expect(pkcMock.pkc.getShortAddress).toHaveBeenCalledWith({ address, name: address });
  });

  test("keeps name params compatible with existing address callers", async () => {
    const name = "12D3KooWS3z6sH3Q7NU2FWU5KL9t1XXSmfnE15BE7vjuFXSvQYSZ";

    await PkcJs.PKC();

    expect(PkcJs.PKC.getShortAddress({ name })).toBe(`short:${name}`);
    expect(pkcMock.pkc.getShortAddress).toHaveBeenCalledWith({ address: name, name });
  });
});
