import { unbatchedUpdates } from './ReactFiberWorkLoop';
import { createFiberRoot } from './ReactFiberRoot';

export { unbatchedUpdates };

export const getPublicRootInstance = (container) => {};

export const updateContainer = (
  element,
  container,
  parentComponent,
  callback
) => {};

export const createContainer = (containerInfo, tag, hydrate) =>
  createFiberRoot(containerInfo, tag, hydrate);
