import { ClassComponent, HostRoot } from './ReactWorkTags';
import { createCursor, push, pop } from './ReactFiberStack';

const emptyContextObject = {};

const contextStackCursor = createCursor(emptyContextObject);
const didPerformWorkStackCursor = createCursor(false);

const isContextProvider = (type) => {
  const { childContextTypes } = type;
  return childContextTypes !== null && childContextTypes !== undefined;
};

const popContext = (fiber) => {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
};

const findCurrentUnmaskedContext = (fiber) => {
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

const hasContextChanged = () => didPerformWorkStackCursor.current;

const pushTopLevelContextObject = (fiber, context, didChange) => {
  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
};

const popTopLevelContextObject = (fiber) => {
  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
};

export {
  emptyContextObject,
  isContextProvider,
  popContext,
  findCurrentUnmaskedContext,
  processChildContext,
  hasContextChanged,
  pushTopLevelContextObject,
  popTopLevelContextObject,
};
