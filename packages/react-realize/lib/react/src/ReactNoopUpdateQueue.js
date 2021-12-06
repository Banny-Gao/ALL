const warnNoop = (publicInstance, callerName) => {};

export const ReactNoopUpdateQueue = {
  isMounted: () => false,
  enqueueForceUpdate: (publicInstance) => {
    warnNoop(publicInstance, 'forceUpdate');
  },
  enqueueReplaceState: (publicInstance) => {
    warnNoop(publicInstance, 'replaceState');
  },
  enqueueSetState: (publicInstance) => {
    warnNoop(publicInstance, 'setState');
  },
};
