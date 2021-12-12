const randomKey = Math.random().toString(36).slice(2);

const internalContainerInstanceKey = '__reactContainer$' + randomKey;
const internalEventHandlersKey = '__reactEvents$' + randomKey;

export const markContainerAsRoot = (hostRoot, node) => {
  node[internalContainerInstanceKey] = hostRoot;
};

export const getEventListenerSet = (node) => {
  let elementListenerSet = node[internalEventHandlersKey];
  if (elementListenerSet === undefined) {
    elementListenerSet = node[internalEventHandlersKey] = new Set();
  }
  return elementListenerSet;
};
