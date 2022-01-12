import { createCursor, push, pop } from './ReactFiberStack';
import { getRootHostContext, getChildNamespace } from './ReactFiberHostConfig';

const invariant = require('invariant');

const NO_CONTEXT = {};

const contextStackCursor = createCursor(NO_CONTEXT);
const contextFiberStackCursor = createCursor(NO_CONTEXT);
const rootInstanceStackCursor = createCursor(NO_CONTEXT);

const pushHostContainer = (fiber, nextRootInstance) => {
  push(rootInstanceStackCursor, nextRootInstance, fiber);
  push(contextFiberStackCursor, fiber, fiber);

  push(contextStackCursor, NO_CONTEXT, fiber);
  const nextRootContext = getRootHostContext(nextRootInstance);

  pop(contextStackCursor, fiber);
  push(contextStackCursor, nextRootContext, fiber);
};

const popHostContainer = (fiber) => {
  pop(contextStackCursor, fiber);
  pop(contextFiberStackCursor, fiber);
  pop(rootInstanceStackCursor, fiber);
};

const requiredContext = (c) => {
  invariant(
    c !== NO_CONTEXT,
    'Expected host context to exist. This error is likely caused by a bug ' +
      'in React. Please file an issue.'
  );
  return c;
};

const pushHostContext = (fiber) => {
  const context = requiredContext(contextStackCursor.current);
  const nextContext = getChildNamespace(context, fiber.type);

  if (context === nextContext) return;

  push(contextFiberStackCursor, fiber, fiber);
  push(contextStackCursor, nextContext, fiber);
};

const popHostContext = (fiber) => {
  if (contextFiberStackCursor.current !== fiber) return;

  pop(contextStackCursor, fiber);
  pop(contextFiberStackCursor, fiber);
};

const getRootHostContainer = () => {
  const rootInstance = requiredContext(rootInstanceStackCursor.current);
  return rootInstance;
};

const getHostContext = () => {
  const context = requiredContext(contextStackCursor.current);
  return context;
};

export {
  pushHostContainer,
  popHostContainer,
  pushHostContext,
  popHostContext,
  getRootHostContainer,
  getHostContext,
};
