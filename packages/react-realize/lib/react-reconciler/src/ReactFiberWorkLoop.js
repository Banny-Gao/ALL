export const NoContext = 0b0000000;
const BatchedContext = 0b0000001;
const LegacyUnbatchedContext = 0b0001000;

let executionContext = NoContext;
// eslint-disable-next-line no-unused-vars
let workInProgressRootRenderTargetTime = Infinity;

const RENDER_TIMEOUT_MS = 500;

const resetRenderTimer = () =>
  (workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS);

export const unbatchedUpdates = (fn, a) => {
  const prevExecutionContext = executionContext;
  executionContext &= BatchedContext;
  executionContext |= LegacyUnbatchedContext;

  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
    if (executionContext === NoContext) {
      resetRenderTimer();
      flushSyncCallbackQueue();
    }
  }
};
