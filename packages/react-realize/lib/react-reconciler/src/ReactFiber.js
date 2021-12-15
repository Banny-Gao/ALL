import { BlockingRoot, ConcurrentRoot } from './ReactRootTags';
import {
  ConcurrentMode,
  BlockingMode,
  StrictMode,
  NoMode,
} from './ReactTypeOfMode';
import { HostRoot } from './ReactWorkTags';
import { NoLanes } from './ReactFiberLane';
import { NoFlags } from './ReactFiberFlags';

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

export const createWorkInProgress = (current, pendingProps) => {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;

    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;

    workInProgress.type = current.type;

    workInProgress.flags = NoFlags;

    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }

  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext,
        };

  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;

  return workInProgress;
};
