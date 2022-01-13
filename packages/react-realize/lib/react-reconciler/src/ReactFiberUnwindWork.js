import { HostRoot } from './ReactWorkTags';
import { popHostContainer } from './ReactFiberHostContext';
import { popTopLevelContextObject } from './ReactFiberContext';
import { resetWorkInProgressVersions } from './ReactMutableSource';
import { DidCapture, NoFlags, ShouldCapture } from './ReactFiberFlags';

const invariant = require('invariant');

const unwindInterruptedWork = (interruptedWork) => {};

const unwindWork = (workInProgress, renderLanes) => {
  switch (workInProgress.tag) {
    // case ClassComponent: {
    //   const Component = workInProgress.type;
    //   if (isLegacyContextProvider(Component)) {
    //     popLegacyContext(workInProgress);
    //   }
    //   const flags = workInProgress.flags;
    //   if (flags & ShouldCapture) {
    //     workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
    //     if (
    //       enableProfilerTimer &&
    //       (workInProgress.mode & ProfileMode) !== NoMode
    //     ) {
    //       transferActualDuration(workInProgress);
    //     }
    //     return workInProgress;
    //   }
    //   return null;
    // }
    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelContextObject(workInProgress);
      resetWorkInProgressVersions();
      const flags = workInProgress.flags;
      invariant(
        (flags & DidCapture) === NoFlags,
        'The root failed to unmount after an error. This is likely a bug in ' +
          'React. Please file an issue.'
      );
      workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
      console.log(flags, (flags & ~ShouldCapture) | DidCapture);
      return workInProgress;
    }
    // case HostComponent: {
    //   // TODO: popHydrationState
    //   popHostContext(workInProgress);
    //   return null;
    // }
    // case SuspenseComponent: {
    //   popSuspenseContext(workInProgress);
    //   if (enableSuspenseServerRenderer) {
    //     const suspenseState: null | SuspenseState =
    //       workInProgress.memoizedState;
    //     if (suspenseState !== null && suspenseState.dehydrated !== null) {
    //       invariant(
    //         workInProgress.alternate !== null,
    //         'Threw in newly mounted dehydrated component. This is likely a bug in ' +
    //           'React. Please file an issue.',
    //       );
    //       resetHydrationState();
    //     }
    //   }
    //   const flags = workInProgress.flags;
    //   if (flags & ShouldCapture) {
    //     workInProgress.flags = (flags & ~ShouldCapture) | DidCapture;
    //     // Captured a suspense effect. Re-render the boundary.
    //     if (
    //       enableProfilerTimer &&
    //       (workInProgress.mode & ProfileMode) !== NoMode
    //     ) {
    //       transferActualDuration(workInProgress);
    //     }
    //     return workInProgress;
    //   }
    //   return null;
    // }
    // case SuspenseListComponent: {
    //   popSuspenseContext(workInProgress);
    //   // SuspenseList doesn't actually catch anything. It should've been
    //   // caught by a nested boundary. If not, it should bubble through.
    //   return null;
    // }
    // case HostPortal:
    //   popHostContainer(workInProgress);
    //   return null;
    // case ContextProvider:
    //   popProvider(workInProgress);
    //   return null;
    // case OffscreenComponent:
    // case LegacyHiddenComponent:
    //   popRenderLanes(workInProgress);
    //   return null;
    default:
      return null;
  }
};

export { unwindInterruptedWork, unwindWork };
