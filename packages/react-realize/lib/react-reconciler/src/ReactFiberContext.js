import { ClassComponent, HostRoot } from './ReactWorkTags';

export const emptyContextObject = {};

const isContextProvider = (type) => {
  const { childContextTypes } = type;
  return childContextTypes !== null && childContextTypes !== undefined;
};

export const findCurrentUnmaskedContext = (fiber) => {
  let node = fiber;

  do {
    switch (node.tag) {
      case HostRoot:
        return node.stateNode.context;
      case ClassComponent: {
        const Component = node.type;
        if (isContextProvider(Component)) {
          return node.stateNode.__reactInternalMemoizedMergedChildContext;
        }
        break;
      }
    }
    node = node.return;
  } while (node !== null);
};

const processChildContext = (fiber, type, parentContext) => {
  const instance = fiber.stateNode;

  if (typeof instance.getChildContext !== 'function') return parentContext;

  const childContext = instance.getChildContext();

  return { ...parentContext, ...childContext };
};

export { isContextProvider, processChildContext };
