import { HostComponent, SuspenseComponent, HostRoot } from './ReactWorkTags';
import {
  getFirstHydratableChild,
  shouldSetTextContent,
  getNextHydratableSibling,
  getNextHydratableInstanceAfterSuspenseInstance,
  canHydrateInstance,
} from './ReactFiberHostConfig';
import { createFiberFromHostInstanceForDeletion } from './ReactFiber';
import { Hydrating, Placement, Deletion } from './ReactFiberFlags';

let hydrationParentFiber = null;
let nextHydratableInstance = null;
let isHydrating = false;

const resetHydrationState = () => {
  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
};

const enterHydrationState = (fiber) => {
  const parentInstance = fiber.stateNode.containerInfo;
  nextHydratableInstance = getFirstHydratableChild(parentInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  return true;
};

const skipPastDehydratedSuspenseInstance = (fiber) => {
  const suspenseState = fiber.memoizedState;
  const suspenseInstance =
    suspenseState !== null ? suspenseState.dehydrated : null;
  invariant(
    suspenseInstance,
    'Expected to have a hydrated suspense instance. ' +
      'This error is likely caused by a bug in React. Please file an issue.'
  );
  return getNextHydratableInstanceAfterSuspenseInstance(suspenseInstance);
};

const deleteHydratableInstance = (returnFiber, instance) => {
  const childToDelete = createFiberFromHostInstanceForDeletion();
  childToDelete.stateNode = instance;
  childToDelete.return = returnFiber;
  childToDelete.flags = Deletion;

  if (returnFiber.lastEffect !== null) {
    returnFiber.lastEffect.nextEffect = childToDelete;
    returnFiber.lastEffect = childToDelete;
  } else {
    returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
  }
};

const popToNextHostParent = (fiber) => {
  let parent = fiber.return;
  while (
    parent !== null &&
    parent.tag !== HostComponent &&
    parent.tag !== HostRoot &&
    parent.tag !== SuspenseComponent
  ) {
    parent = parent.return;
  }
  hydrationParentFiber = parent;
};

const popHydrationState = (fiber) => {
  if (fiber !== hydrationParentFiber) return false;
  if (!isHydrating) {
    popToNextHostParent(fiber);
    isHydrating = true;
    return false;
  }

  const type = fiber.type;

  if (
    fiber.tag !== HostComponent ||
    (type !== 'head' &&
      type !== 'body' &&
      !shouldSetTextContent(type, fiber.memoizedProps))
  ) {
    let nextInstance = nextHydratableInstance;
    while (nextInstance) {
      deleteHydratableInstance(fiber, nextInstance);
      nextInstance = getNextHydratableSibling(nextInstance);
    }
  }

  popToNextHostParent(fiber);
  if (fiber.tag === SuspenseComponent) {
    nextHydratableInstance = skipPastDehydratedSuspenseInstance(fiber);
  } else {
    nextHydratableInstance = hydrationParentFiber
      ? getNextHydratableSibling(fiber.stateNode)
      : null;
  }
  return true;
};

const insertNonHydratedInstance = (returnFiber, fiber) => {
  fiber.flags = (fiber.flags & ~Hydrating) | Placement;
};

const tryHydrate = (fiber, nextInstance) => {
  switch (fiber.tag) {
    case HostComponent: {
      const type = fiber.type;
      const props = fiber.pendingProps;
      const instance = canHydrateInstance(nextInstance, type, props);
      if (instance !== null) {
        fiber.stateNode = instance;
        return true;
      }
      return false;
    }
    case SuspenseComponent: {
      return false;
    }
    default:
      return false;
  }
};

const tryToClaimNextHydratableInstance = (fiber) => {
  let nextInstance = nextHydratableInstance;
  if (!nextInstance) {
    insertNonHydratedInstance(hydrationParentFiber, fiber);
    isHydrating = false;
    hydrationParentFiber = fiber;
    return;
  }
  const firstAttemptedInstance = nextInstance;
  if (!tryHydrate(fiber, nextInstance)) {
    nextInstance = getNextHydratableSibling(firstAttemptedInstance);
    if (!nextInstance || !tryHydrate(fiber, nextInstance)) {
      insertNonHydratedInstance(hydrationParentFiber, fiber);
      isHydrating = false;
      hydrationParentFiber = fiber;
      return;
    }

    deleteHydratableInstance(hydrationParentFiber, firstAttemptedInstance);
  }
  hydrationParentFiber = fiber;
  nextHydratableInstance = getFirstHydratableChild(nextInstance);
};

const prepareToHydrateHostInstance = (
  fiber,
  rootContainerInstance,
  hostContext
) => {
  const instance = fiber.stateNode;
  const updatePayload = hydrateInstance(
    instance,
    fiber.type,
    fiber.memoizedProps,
    rootContainerInstance,
    hostContext,
    fiber
  );

  fiber.updateQueue = updatePayload;

  if (updatePayload !== null) {
    return true;
  }
  return false;
};

export {
  resetHydrationState,
  enterHydrationState,
  popHydrationState,
  tryToClaimNextHydratableInstance,
  prepareToHydrateHostInstance,
};
