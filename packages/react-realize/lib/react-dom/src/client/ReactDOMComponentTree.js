const randomKey = Math.random().toString(36).slice(2);

const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;
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

export const precacheFiberNode = (hostInst, node) => {
  node[internalInstanceKey] = hostInst;
};

export const updateFiberProps = (node, props) => {
  node[internalPropsKey] = props;
};
