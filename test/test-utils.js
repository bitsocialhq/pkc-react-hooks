import React from "react";
import ReactDOM from "react-dom/client";
import { act } from "@testing-library/react";

// Track all roots created by renderHook so we can clean them up between tests,
// preventing leaked React trees with duplicate store subscriptions.
const activeRoots = [];

if (typeof afterEach === "function") {
  afterEach(() => {
    for (const { root, container } of activeRoots) {
      act(() => {
        root.unmount();
      });
      container.remove();
    }
    activeRoots.length = 0;
  });
}

// Custom renderHook that manages the React root directly, bypassing RTL's
// render/rerender. This is necessary because RTL auto-cleanup unmounts roots
// between it() blocks via afterEach, breaking tests that create `rendered`
// in beforeAll and reuse it across tests. React 19 throws "Cannot update an
// unmounted root" when rerender is called on a root that RTL already cleaned up.
//
// We register our OWN afterEach cleanup above, but tests that share `rendered`
// across it() blocks via beforeAll will call detach() to opt out of auto-cleanup.
export function renderHook(callback, options) {
  const { initialProps, wrapper: Wrapper } = options || {};
  const result = { current: null, all: [] };

  function TestComponent({ renderCallbackProps }) {
    const pendingResult = callback(renderCallbackProps);
    result.current = pendingResult;
    result.all.push(pendingResult);
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);

  const entry = { root, container };
  activeRoots.push(entry);

  function renderUI(props) {
    let element = React.createElement(TestComponent, { renderCallbackProps: props });
    if (Wrapper) {
      element = React.createElement(Wrapper, null, element);
    }
    act(() => {
      root.render(element);
    });
  }

  renderUI(initialProps);

  function rerender(rerenderCallbackProps) {
    renderUI(rerenderCallbackProps);
  }

  function unmount() {
    act(() => {
      root.unmount();
    });
    container.remove();
    const idx = activeRoots.indexOf(entry);
    if (idx !== -1) activeRoots.splice(idx, 1);
  }

  // Remove this root from auto-cleanup. Call this for roots created in
  // beforeAll that must survive across multiple it() blocks.
  function detach() {
    const idx = activeRoots.indexOf(entry);
    if (idx !== -1) activeRoots.splice(idx, 1);
  }

  return { result, rerender, unmount, detach };
}
