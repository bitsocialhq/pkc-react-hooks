/* usage:

useInterval(
  callback: () => void,
  delay: number,
  immediate?: boolean
)

*/
import { useEffect, useRef } from "react";
function useInterval(callback, delay, immediate, dependencies = []) {
    const savedCallback = useRef(undefined);
    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    });
    // Execute callback if immediate is set.
    useEffect(() => {
        var _a;
        if (!immediate)
            return;
        if (delay === null || delay === false)
            return;
        (_a = savedCallback.current) === null || _a === void 0 ? void 0 : _a.call(savedCallback);
    }, [immediate, ...dependencies]);
    // Set up the interval.
    useEffect(() => {
        if (delay === null || delay === false)
            return undefined;
        const tick = () => { var _a; return (_a = savedCallback.current) === null || _a === void 0 ? void 0 : _a.call(savedCallback); };
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}
export default useInterval;
//# sourceMappingURL=use-interval.js.map