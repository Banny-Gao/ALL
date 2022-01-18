import {
  unbatchedUpdates,
  requestEventTime,
  requestUpdateLane,
  scheduleUpdateOnFiber,
} from './ReactFiberWorkLoop';
import { createFiberRoot } from './ReactFiberRoot';
import {
  emptyContextObject,
  findCurrentUnmaskedContext,
  isContextProvider,
  processChildContext,
} from './ReactFiberContext';
import { ClassComponent } from './ReactWorkTags';
import { createUpdate, enqueueUpdate } from './ReactUpdateQueue';

import { get as getInstance } from '../../ReactInstanceMap';

export const getPublicRootInstance = (container) => {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }

  return containerFiber.child.stateNode;
};

const getContextForSubtree = (parentComponent) => {
  if (!parentComponent) {
    return emptyContextObject;
  }

  const fiber = getInstance(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;
    if (isContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
};

export const updateContainer = (
  element,
  container,
  parentComponent,
  callback
) => {
  const current = container.current;
  const eventTime = requestEventTime();

  const lane = requestUpdateLane(current); // SyncLane: 1

  const context = getContextForSubtree(parentComponent);

  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(eventTime, lane);

  update.payload = { element };

  callback = callback === undefined ? null : callback;

  if (callback) update.callback = callback;

  enqueueUpdate(current, update);
  console.log(current, '--------updateContainer>enqueueUpdate: current');

  scheduleUpdateOnFiber(current, lane, eventTime);

  return lane;
};

export const createContainer = (containerInfo, tag, hydrate) =>
  createFiberRoot(containerInfo, tag, hydrate);

export { unbatchedUpdates };
