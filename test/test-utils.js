import { render, act } from "@testing-library/react";
import React from "react";

// Custom renderHook that sets result.current synchronously during render,
// matching @testing-library/react-hooks behavior. RTL v16's renderHook defers
// result.current via useEffect, which breaks polling-based waitFor patterns
// and throws "Cannot update an unmounted root" on rerender with React 19.
export function renderHook(callback, options) {
  const { initialProps, ...renderOptions } = options || {};
  const result = { current: null, all: [] };

  function TestComponent({ renderCallbackProps }) {
    const pendingResult = callback(renderCallbackProps);
    result.current = pendingResult;
    result.all.push(pendingResult);
    return null;
  }

  const { rerender: baseRerender, unmount } = render(
    React.createElement(TestComponent, { renderCallbackProps: initialProps }),
    renderOptions,
  );

  function rerender(rerenderCallbackProps) {
    return baseRerender(
      React.createElement(TestComponent, { renderCallbackProps: rerenderCallbackProps }),
    );
  }

  return { result, rerender, unmount };
}
