import { ClassComponent, HostRoot } from './ReactWorkTags';
import { createCursor, push, pop } from './ReactFiberStack';

const emptyContextObject = {};

const contextStackCursor = createCursor(emptyContextObject);
const didPerformWorkStackCursor = createCursor(false);

let previousContext = emptyContextObject;

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

const pushContextProvider = (workInProgress) => {
  const instance = workInProgress.stateNode;

  const memoizedMergedChildContext =
    (instance && instance.__reactInternalMemoizedMergedChildContext) ||
    emptyContextObject;

  previousContext = contextStackCursor.current;
  push(contextStackCursor, memoizedMergedChildContext, workInProgress);
  push(
    didPerformWorkStackCursor,
    didPerformWorkStackCursor.current,
    workInProgress
  );

  return true;
};

const getUnmaskedContext = (
  workInProgress,
  Component,
  didPushOwnContextIfProvider
) => {
  if (didPushOwnContextIfProvider && isContextProvider(Component)) {
    return previousContext;
  }
  return contextStackCursor.current;
};

const cacheContext = (workInProgress, unmaskedContext, maskedContext) => {
  const instance = workInProgress.stateNode;
  instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
  instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
};

const getMaskedContext = (workInProgress, unmaskedContext) => {
  const type = workInProgress.type;
  const contextTypes = type.contextTypes;
  if (!contextTypes) return emptyContextObject;

  const instance = workInProgress.stateNode;
  if (
    instance &&
    instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext
  ) {
    return instance.__reactInternalMemoizedMaskedChildContext;
  }

  const context = {};
  for (const key in contextTypes) {
    context[key] = unmaskedContext[key];
  }

  if (instance) {
    cacheContext(workInProgress, unmaskedContext, context);
  }

  return context;
};

const invalidateContextProvider = (workInProgress, type, didChange) => {
  const instance = workInProgress.stateNode;
  invariant(
    instance,
    'Expected to have an instance by this point. ' +
      'This error is likely caused by a bug in React. Please file an issue.'
  );

  if (didChange) {
    const mergedContext = processChildContext(
      workInProgress,
      type,
      previousContext
    );
    instance.__reactInternalMemoizedMergedChildContext = mergedContext;

    pop(didPerformWorkStackCursor, workInProgress);
    pop(contextStackCursor, workInProgress);

    push(contextStackCursor, mergedContext, workInProgress);
    push(didPerformWorkStackCursor, didChange, workInProgress);
  } else {
    pop(didPerformWorkStackCursor, workInProgress);
    push(didPerformWorkStackCursor, didChange, workInProgress);
  }
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
  pushContextProvider,
  getUnmaskedContext,
  getMaskedContext,
  cacheContext,
  invalidateContextProvider,
};
