import { NoLanes, includesSomeLane } from './ReactFiberLane';
import { hasContextChanged } from './ReactFiberContext';
import { NoFlags, ForceUpdateForLegacySuspense } from './ReactFiberFlags';
import { HostRoot } from './ReactWorkTags';

let didReceiveUpdate = false;

const updateHostRoot = (current, workInProgress, renderLanes) => {};

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
    // case HostComponent:
    //   return updateHostComponent(current, workInProgress, renderLanes);
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
