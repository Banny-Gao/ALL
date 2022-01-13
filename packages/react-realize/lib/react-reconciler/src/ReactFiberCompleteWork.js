import { HostRoot, HostComponent, HostText, HostPortal } from './ReactWorkTags';
import { Ref, Update, NoFlags, DidCapture, Snapshot } from './ReactFiberFlags';
import { popTopLevelContextObject } from './ReactFiberContext';
import {
  popHostContainer,
  getRootHostContainer,
  getHostContext,
  popHostContext,
} from './ReactFiberHostContext';
import { resetWorkInProgressVersions } from './ReactMutableSource';
import {
  popHydrationState,
  prepareToHydrateHostInstance,
} from './ReactFiberHydrationContext';
import {
  prepareUpdate,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
} from './ReactFiberHostConfig';

const invariant = require('invariant');

const markUpdate = (workInProgress) => {
  workInProgress.flags |= Update;
};

const updateHostComponent = (
  current,
  workInProgress,
  type,
  newProps,
  rootContainerInstance
) => {
  const oldProps = current.memoizedProps;
  if (oldProps === newProps) return;

  const instance = workInProgress.stateNode;
  const currentHostContext = getHostContext();

  const updatePayload = prepareUpdate(
    instance,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    currentHostContext
  );

  workInProgress.updateQueue = updatePayload;

  if (updatePayload) {
    markUpdate(workInProgress);
  }
};

const appendAllChildren = (
  parent,
  workInProgress,
  needsVisibilityToggle,
  isHidden
) => {
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.tag === HostPortal) {
      // If we have a portal child, then we don't want to traverse
      // down its children. Instead, we'll get insertions from each child in
      // the portal directly.
    } else if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};

const completeWork = (current, workInProgress, renderLanes) => {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostRoot: {
      popHostContainer(workInProgress);
      popTopLevelContextObject(workInProgress);
      resetWorkInProgressVersions();
      const fiberRoot = workInProgress.stateNode;
      if (fiberRoot.pendingContext) {
        fiberRoot.context = fiberRoot.pendingContext;
        fiberRoot.pendingContext = null;
      }
      if (current === null || current.child === null) {
        const wasHydrated = popHydrationState(workInProgress);
        if (wasHydrated) {
          markUpdate(workInProgress);
        } else if (!fiberRoot.hydrate) {
          workInProgress.flags |= Snapshot;
        }
      }

      return null;
    }
    case HostComponent: {
      popHostContext(workInProgress);
      const rootContainerInstance = getRootHostContainer();

      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          rootContainerInstance
        );

        if (current.ref !== workInProgress.ref) {
          markRef(workInProgress);
        }
      } else {
        if (!newProps) {
          invariant(
            workInProgress.stateNode !== null,
            'We must have new props for new mounts. This error is likely ' +
              'caused by a bug in React. Please file an issue.'
          );

          return null;
        }

        const currentHostContext = getHostContext();

        const wasHydrated = popHydrationState(workInProgress);
        if (wasHydrated) {
          if (
            prepareToHydrateHostInstance(
              workInProgress,
              rootContainerInstance,
              currentHostContext
            )
          ) {
            markUpdate(workInProgress);
          }
        } else {
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress
          );

          appendAllChildren(instance, workInProgress, false, false);

          workInProgress.stateNode = instance;

          if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext
            )
          ) {
            markUpdate(workInProgress);
          }
        }

        if (workInProgress.ref !== null) {
          markRef(workInProgress);
        }
      }
      return null;
    }
  }
};

export { completeWork };
