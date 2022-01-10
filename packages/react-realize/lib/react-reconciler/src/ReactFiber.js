import { BlockingRoot, ConcurrentRoot } from './ReactRootTags';
import {
  ConcurrentMode,
  BlockingMode,
  StrictMode,
  NoMode,
} from './ReactTypeOfMode';
import {
  IndeterminateComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  ForwardRef,
  Fragment,
  ContextConsumer,
  MemoComponent,
  LazyComponent,
  SuspenseComponent,
  HostText,
} from './ReactWorkTags';
import { NoLanes } from './ReactFiberLane';
import { NoFlags } from './ReactFiberFlags';
import {
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
} from '../../ReactSymbols';

const invariant = require('invariant');
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
      memoizedProps: null,
      updateQueue: null,
      memoizedState: null,
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

  console.log(workInProgress, current, '-------');

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

export const createFiberFromFragment = (elements, mode, lanes, key) => {
  const fiber = createFiber(Fragment, elements, key, mode);
  fiber.lanes = lanes;
  return fiber;
};

export const createFiberFromSuspense = (pendingProps, mode, lanes, key) => {
  const fiber = createFiber(SuspenseComponent, pendingProps, key, mode);

  fiber.type = REACT_SUSPENSE_TYPE;
  fiber.elementType = REACT_SUSPENSE_TYPE;

  fiber.lanes = lanes;
  return fiber;
};

const shouldConstruct = (Component) => {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
};

export const createFiberFromTypeAndProps = (
  type,
  key,
  pendingProps,
  owner,
  mode,
  lanes
) => {
  let fiberTag = IndeterminateComponent;

  let resolvedType = type;
  if (typeof type === 'function' && shouldConstruct(type)) {
    fiberTag = ClassComponent;
  } else if (typeof type === 'string') {
    fiberTag = HostComponent;
  } else {
    switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(pendingProps.children, mode, lanes, key);
      case REACT_SUSPENSE_TYPE:
        return createFiberFromSuspense(pendingProps, mode, lanes, key);
      default: {
        if (typeof type === 'object' && type !== null) {
          switch (type.$$typeof) {
            case REACT_CONTEXT_TYPE:
              fiberTag = ContextConsumer;
              break;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = ForwardRef;

              break;
            case REACT_MEMO_TYPE:
              fiberTag = MemoComponent;
              break;
            case REACT_LAZY_TYPE:
              fiberTag = LazyComponent;
              resolvedType = null;
              break;
          }
        }
      }
    }
  }

  const fiber = createFiber(fiberTag, pendingProps, key, mode);
  fiber.elementType = type;
  fiber.type = resolvedType;
  fiber.lanes = lanes;

  if (__DEV__) {
    fiber._debugOwner = owner;
  }

  return fiber;
};

export const createFiberFromElement = (element, mode, lanes) => {
  const owner = null;

  const type = element.type;
  const key = element.key;
  const pendingProps = element.props;
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    lanes
  );

  return fiber;
};

export const createFiberFromText = (content, mode, lanes) => {
  const fiber = createFiber(HostText, content, null, mode);
  fiber.lanes = lanes;
  return fiber;
};
