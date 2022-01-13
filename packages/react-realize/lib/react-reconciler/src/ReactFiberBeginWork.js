import { NoLanes, includesSomeLane } from './ReactFiberLane';
import {
  hasContextChanged,
  pushTopLevelContextObject,
} from './ReactFiberContext';
import {
  NoFlags,
  ForceUpdateForLegacySuspense,
  Placement,
  Hydrating,
  Ref,
  ContentReset
} from './ReactFiberFlags';
import { HostRoot, HostComponent } from './ReactWorkTags';
import {
  pushHostContainer,
  pushHostContext,
} from './ReactFiberHostContext';
import { cloneUpdateQueue, processUpdateQueue } from './ReactUpdateQueue';
import {
  resetHydrationState,
  enterHydrationState,
  tryToClaimNextHydratableInstance,
} from './ReactFiberHydrationContext';
import { markSkippedUpdateLanes } from './ReactFiberWorkLoop';
import {
  cloneChildFibers,
  mountChildFibers,
  reconcileChildFibers,
} from './ReactChildFiber';
import { setWorkInProgressVersion } from './ReactMutableSource';
import { shouldSetTextContent } from './ReactFiberHostConfig';

const invariant = require('invariant');

let didReceiveUpdate = false;

const pushHostRootContext = (workInProgress) => {
  const root = workInProgress.stateNode;
  if (root.pendingContext) {
    pushTopLevelContextObject(
      workInProgress,
      root.pendingContext,
      root.pendingContext !== root.context
    );
  } else if (root.context) {
    pushTopLevelContextObject(workInProgress, root.context, false);
  }

  pushHostContainer(workInProgress, root.containerInfo);
};

const bailoutOnAlreadyFinishedWork = (current, workInProgress, renderLanes) => {
  if (current !== null) workInProgress.dependencies = current.dependencies;

  markSkippedUpdateLanes(workInProgress.lanes);

  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) return null;
  cloneChildFibers(current, workInProgress);

  return workInProgress.child;
};

const reconcileChildren = (
  current,
  workInProgress,
  nextChildren,
  renderLanes
) => {
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes
    );
  }
};

const updateHostRoot = (current, workInProgress, renderLanes) => {
  pushHostRootContext(workInProgress);
  const updateQueue = workInProgress.updateQueue;
  invariant(
    current !== null && updateQueue !== null,
    'If the root does not have an updateQueue, we should have already ' +
      'bailed out. This error is likely caused by a bug in React. Please ' +
      'file an issue.'
  );

  const nextProps = workInProgress.pendingProps;
  const prevState = workInProgress.memoizedState;
  const prevChildren = prevState !== null ? prevState.element : null;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);

  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;

  console.log(prevChildren, nextChildren, '--------prevChildren, nextChildren');
  if (nextChildren === prevChildren) {
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  const root = workInProgress.stateNode;

  if (root.hydrate && enterHydrationState(workInProgress)) {
    const mutableSourceEagerHydrationData =
      root.mutableSourceEagerHydrationData;
    if (mutableSourceEagerHydrationData != null) {
      for (let i = 0; i < mutableSourceEagerHydrationData.length; i += 2) {
        const mutableSource = mutableSourceEagerHydrationData[i];
        const version = mutableSourceEagerHydrationData[i + 1];
        setWorkInProgressVersion(mutableSource, version);
      }
    }

    const child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes
    );
    workInProgress.child = child;

    let node = child;
    while (node) {
      node.flags = (node.flags & ~Placement) | Hydrating;
      node = node.sibling;
    }
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    resetHydrationState();
  }

  return workInProgress.child;
};

const markRef = (current, workInProgress) => {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    workInProgress.flags |= Ref;
  }
};

const updateHostComponent = (current, workInProgress, renderLanes) => {
  pushHostContext(workInProgress);

  if (current === null) tryToClaimNextHydratableInstance(workInProgress);

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    workInProgress.flags |= ContentReset;
  }

  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
};

const beginWork = (current, workInProgress, renderLanes) => {
  const updateLanes = workInProgress.lanes;

  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (oldProps !== newProps || hasContextChanged()) {
      didReceiveUpdate = true;
    } else if (!includesSomeLane(renderLanes, updateLanes)) {
      //
    } else {
      if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
        didReceiveUpdate = true;
      } else {
        didReceiveUpdate = false;
      }
    }
  } else didReceiveUpdate = false;

  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    // case IndeterminateComponent: {
    //   return mountIndeterminateComponent(
    //     current,
    //     workInProgress,
    //     workInProgress.type,
    //     renderLanes,
    //   );
    // }
    // case LazyComponent: {
    //   const elementType = workInProgress.elementType;
    //   return mountLazyComponent(
    //     current,
    //     workInProgress,
    //     elementType,
    //     updateLanes,
    //     renderLanes,
    //   );
    // }
    // case FunctionComponent: {
    //   const Component = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   const resolvedProps =
    //     workInProgress.elementType === Component
    //       ? unresolvedProps
    //       : resolveDefaultProps(Component, unresolvedProps);
    //   return updateFunctionComponent(
    //     current,
    //     workInProgress,
    //     Component,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    // case ClassComponent: {
    //   const Component = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   const resolvedProps =
    //     workInProgress.elementType === Component
    //       ? unresolvedProps
    //       : resolveDefaultProps(Component, unresolvedProps);
    //   return updateClassComponent(
    //     current,
    //     workInProgress,
    //     Component,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
    // case HostText:
    //   return updateHostText(current, workInProgress);
    // case SuspenseComponent:
    //   return updateSuspenseComponent(current, workInProgress, renderLanes);
    // case HostPortal:
    //   return updatePortalComponent(current, workInProgress, renderLanes);
    // case ForwardRef: {
    //   const type = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   const resolvedProps =
    //     workInProgress.elementType === type
    //       ? unresolvedProps
    //       : resolveDefaultProps(type, unresolvedProps);
    //   return updateForwardRef(
    //     current,
    //     workInProgress,
    //     type,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    // case Fragment:
    //   return updateFragment(current, workInProgress, renderLanes);
    // case Mode:
    //   return updateMode(current, workInProgress, renderLanes);
    // case Profiler:
    //   return updateProfiler(current, workInProgress, renderLanes);
    // case ContextProvider:
    //   return updateContextProvider(current, workInProgress, renderLanes);
    // case ContextConsumer:
    //   return updateContextConsumer(current, workInProgress, renderLanes);
    // case MemoComponent: {
    //   const type = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   // Resolve outer props first, then resolve inner props.
    //   let resolvedProps = resolveDefaultProps(type, unresolvedProps);
    //   resolvedProps = resolveDefaultProps(type.type, resolvedProps);
    //   return updateMemoComponent(
    //     current,
    //     workInProgress,
    //     type,
    //     resolvedProps,
    //     updateLanes,
    //     renderLanes,
    //   );
    // }
    // case SimpleMemoComponent: {
    //   return updateSimpleMemoComponent(
    //     current,
    //     workInProgress,
    //     workInProgress.type,
    //     workInProgress.pendingProps,
    //     updateLanes,
    //     renderLanes,
    //   );
    // }
    // case IncompleteClassComponent: {
    //   const Component = workInProgress.type;
    //   const unresolvedProps = workInProgress.pendingProps;
    //   const resolvedProps =
    //     workInProgress.elementType === Component
    //       ? unresolvedProps
    //       : resolveDefaultProps(Component, unresolvedProps);
    //   return mountIncompleteClassComponent(
    //     current,
    //     workInProgress,
    //     Component,
    //     resolvedProps,
    //     renderLanes,
    //   );
    // }
    // case SuspenseListComponent: {
    //   return updateSuspenseListComponent(current, workInProgress, renderLanes);
    // }
    // case FundamentalComponent: {
    //   if (enableFundamentalAPI) {
    //     return updateFundamentalComponent(current, workInProgress, renderLanes);
    //   }
    //   break;
    // }
    // case ScopeComponent: {
    //   if (enableScopeAPI) {
    //     return updateScopeComponent(current, workInProgress, renderLanes);
    //   }
    //   break;
    // }
    // case Block: {
    //   if (enableBlocksAPI) {
    //     const block = workInProgress.type;
    //     const props = workInProgress.pendingProps;
    //     return updateBlock(current, workInProgress, block, props, renderLanes);
    //   }
    //   break;
    // }
    // case OffscreenComponent: {
    //   return updateOffscreenComponent(current, workInProgress, renderLanes);
    // }
    // case LegacyHiddenComponent: {
    //   return updateLegacyHiddenComponent(current, workInProgress, renderLanes);
    // }
  }
};

export { beginWork };
