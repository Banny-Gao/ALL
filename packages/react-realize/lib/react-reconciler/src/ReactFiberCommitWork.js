import {
  FunctionComponent,
  ForwardRef,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  IncompleteClassComponent,
  SimpleMemoComponent,
  Block,
  FundamentalComponent,
  DehydratedFragment,
  MemoComponent,
  SuspenseComponent,
  OffscreenComponent,
  LegacyHiddenComponent,
} from './ReactWorkTags';

import { Snapshot, ContentReset, Placement } from './ReactFiberFlags';

import { resolveDefaultProps } from './ReactFiberLazyComponent';
import {
  clearContainer,
  resetTextContent,
  insertInContainerBefore,
  appendChildToContainer,
  commitUpdate,
  commitTextUpdate,
} from './ReactFiberHostConfig';

import {
  NoFlags as NoHookEffect,
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive,
} from './ReactHookEffectTags';

const invariant = require('invariant');

const isSuspenseBoundaryBeingHidden = (current, finishedWork) => {
  if (current !== null) {
    const oldState = current.memoizedState;
    if (oldState === null || oldState.dehydrated !== null) {
      const newState = finishedWork.memoizedState;
      return newState !== null && newState.dehydrated === null;
    }
  }
  return false;
};

const commitBeforeMutationLifeCycles = (current, finishedWork) => {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      return;
    }
    case ClassComponent: {
      if (finishedWork.flags & Snapshot) {
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const instance = finishedWork.stateNode;

          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState
          );

          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      return;
    }
    case HostRoot: {
      if (finishedWork.flags & Snapshot) {
        const root = finishedWork.stateNode;
        clearContainer(root.containerInfo);
      }
      return;
    }
    case HostComponent:
    case HostText:
    case HostPortal:
    case IncompleteClassComponent:
      return;
  }

  invariant(
    false,
    'This unit of work tag should not have side-effects. This error is ' +
      'likely caused by a bug in React. Please file an issue.'
  );
};

const commitResetTextContent = (current) => {
  resetTextContent(current.stateNode);
};

const commitDetachRef = (current) => {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      currentRef(null);
    } else {
      currentRef.current = null;
    }
  }
};

const isHostParent = (fiber) => {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    fiber.tag === HostPortal
  );
};

const getHostParentFiber = (fiber) => {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  invariant(
    false,
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.'
  );
};

const getHostSibling = (fiber) => {
  let node = fiber;
  while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) return null;

      node = node.return;
    }

    node.sibling.return = node.return;
    node = node.sibling;

    let shouldRun = true;
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      node.tag !== DehydratedFragment &&
      shouldRun
    ) {
      if (node.flags & Placement) {
        shouldRun = false;
      }

      if (node.child === null || node.tag === HostPortal) {
        shouldRun = false;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
};

const insertOrAppendPlacementNodeIntoContainer = (node, before, parent) => {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before) {
      insertInContainerBefore(parent, stateNode, before);
    } else {
      appendChildToContainer(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    //
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNodeIntoContainer(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
};

const insertOrAppendPlacementNode = (node, before, parent) => {
  const { tag } = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before) {
      parent.insertBefore(stateNode, before);
    } else {
      parent.appendChild(stateNode);
    }
  } else if (tag === HostPortal) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
};

const commitPlacement = (finishedWork) => {
  const parentFiber = getHostParentFiber(finishedWork);

  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
    default:
      invariant(
        false,
        'Invalid host parent fiber. This error is likely caused by a bug ' +
          'in React. Please file an issue.'
      );
  }
  if (parentFiber.flags & ContentReset) {
    resetTextContent(parent);

    parentFiber.flags &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork);

  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
};

const commitHookEffectListUnmount = (tag, finishedWork) => {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
};

const commitWork = (current, finishedWork) => {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
      return;
    }
    case ClassComponent: {
      return;
    }
    case HostComponent: {
      const instance = finishedWork.stateNode;
      if (instance != null) {
        const newProps = finishedWork.memoizedProps;

        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        const updatePayload = finishedWork.updateQueue;

        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork
          );
        }
      }
      return;
    }
    case HostText: {
      invariant(
        finishedWork.stateNode !== null,
        'This should have a text node initialized. This error is likely ' +
          'caused by a bug in React. Please file an issue.'
      );
      const textInstance = finishedWork.stateNode;
      const newText = finishedWork.memoizedProps;

      const oldText = current !== null ? current.memoizedProps : newText;
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
    case HostRoot: {
      const root = finishedWork.stateNode;
      if (root.hydrate) {
        root.hydrate = false;
        commitHydratedContainer(root.containerInfo);
      }
      return;
    }
    // case SuspenseComponent: {
    //   commitSuspenseComponent(finishedWork);
    //   attachSuspenseRetryListeners(finishedWork);
    //   return;
    // }
    // case IncompleteClassComponent: {
    //   return;
    // }
    // case FundamentalComponent: {
    //   break;
    // }
    // case OffscreenComponent:
    // case LegacyHiddenComponent: {
    //   const newState = finishedWork.memoizedState;
    //   const isHidden = newState !== null;
    //   hideOrUnhideAllChildren(finishedWork, isHidden);
    //   return;
    // }
  }
  invariant(
    false,
    'This unit of work tag should not have side-effects. This error is ' +
      'likely caused by a bug in React. Please file an issue.'
  );
};

const unmountHostComponents = (
  finishedRoot,
  current,
  renderPriorityLevel
) => {};

const detachFiberMutation = (fiber) => {
  fiber.alternate = null;
  fiber.child = null;
  fiber.dependencies = null;
  fiber.firstEffect = null;
  fiber.lastEffect = null;
  fiber.memoizedProps = null;
  fiber.memoizedState = null;
  fiber.pendingProps = null;
  fiber.return = null;
  fiber.updateQueue = null;
};

const commitDeletion = (finishedRoot, current, renderPriorityLevel) => {
  unmountHostComponents(finishedRoot, current, renderPriorityLevel);

  const alternate = current.alternate;
  detachFiberMutation(current);
  if (alternate !== null) {
    detachFiberMutation(alternate);
  }
};

export {
  isSuspenseBoundaryBeingHidden,
  commitBeforeMutationLifeCycles,
  commitResetTextContent,
  commitDetachRef,
  commitPlacement,
  commitWork,
  commitDeletion,
};
