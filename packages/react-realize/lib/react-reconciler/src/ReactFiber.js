import { BlockingRoot, ConcurrentRoot } from './ReactRootTags';
import {
  ConcurrentMode,
  BlockingMode,
  StrictMode,
  NoMode,
} from './ReactTypeOfMode';

import { HostRoot } from './ReactWorkTags';

import { NoLanes } from './ReactFiberLane';

class FiberNode {
  constructor(tag, pendingProps, key, mode) {
    Object.assign(this, {
      // instance
      tag,
      key,
      elementType: null,
      type: null,
      stateNode: null,
      // Fiber
      return: null,
      child: null,
      sibling: null,
      index: 0,

      ref: null,

      pendingProps,
      memorizedProps: null,
      updateQueue: null,
      memorizedState: null,
      dependencies: null,

      mode,
      // Effects
      flags: null,
      nextEffect: null,
      firstEffect: null,
      lastEffect: null,

      lanes: NoLanes,
      childLanes: NoLanes,

      alternate: null,
    });
  }
}

const createFiber = (tag, pendingProps, key, mode) =>
  new FiberNode(tag, pendingProps, key, mode);

export const createHostRootFiber = (tag) => {
  let mode;
  switch (tag) {
    case ConcurrentRoot:
      mode = ConcurrentMode | BlockingMode | StrictMode;
      break;
    case BlockingRoot:
      mode = BlockingRoot | StrictMode;
      break;
    default:
      mode = NoMode;
  }

  return createFiber(HostRoot, null, null, mode);
};
