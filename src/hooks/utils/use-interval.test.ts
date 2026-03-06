import { renderHook } from "../../lib/test-utils";
import useInterval from "./use-interval";

describe("useInterval", () => {
  test("null delay early return - no interval runs", () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, null));
    expect(fn).not.toHaveBeenCalled();
  });

  test("false delay early return - no interval runs", () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, false));
    expect(fn).not.toHaveBeenCalled();
  });

  test("immediate with null delay - callback not run", () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, null, true));
    expect(fn).not.toHaveBeenCalled();
  });

  test("immediate with false delay - callback not run", () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, false, true));
    expect(fn).not.toHaveBeenCalled();
  });

  test("immediate true with valid delay - callback runs once on mount (func 14)", () => {
    const fn = vi.fn();
    renderHook(() => useInterval(fn, 1000, true));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("cleanup clears interval when delay becomes null", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { rerender } = renderHook(({ delay }) => useInterval(fn, delay), {
      initialProps: { delay: 1000 as number | null },
    });
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
    rerender({ delay: null });
    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  test("cleanup clears interval when delay becomes false", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { rerender } = renderHook(({ delay }) => useInterval(fn, delay), {
      initialProps: { delay: 1000 as number | false },
    });
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
    rerender({ delay: false });
    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
