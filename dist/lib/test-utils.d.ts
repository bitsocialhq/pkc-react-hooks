export declare const silenceUpdateUnmountedComponentWarning: () => () => void;
export declare const silenceTestWasNotWrappedInActWarning: () => () => void;
export declare const silenceOverlappingActWarning: () => () => void;
export declare const silenceReactWarnings: () => void;
type WaitForOptions = {
    timeout?: number;
    interval?: number;
};
export declare const resetStores: () => Promise<void>;
export declare const resetDatabasesAndStores: () => Promise<void>;
declare const testUtils: {
    silenceTestWasNotWrappedInActWarning: () => () => void;
    silenceUpdateUnmountedComponentWarning: () => () => void;
    silenceOverlappingActWarning: () => () => void;
    silenceReactWarnings: () => void;
    restoreAll: () => void;
    resetStores: () => Promise<void>;
    resetDatabasesAndStores: () => Promise<void>;
    createWaitFor: (rendered: any, waitForOptions?: WaitForOptions) => (waitForFunction: Function) => Promise<void>;
    renderHookWithHistory: <Result, Props>(callback: (props: Props) => Result, options?: any) => {
        result: {
            current: Result;
        };
        rerender: (props?: Props | undefined) => void;
        unmount: () => void;
    };
    silenceWaitForWarning: boolean;
};
export default testUtils;
