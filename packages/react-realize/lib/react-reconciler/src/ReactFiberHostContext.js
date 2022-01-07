import { createCursor, push, pop } from './ReactFiberStack';
import { getRootHostContext } from './ReactFiberHostConfig';

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

export { pushHostContainer };
