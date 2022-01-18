import {
  flushSyncCallbackQueue,
  now,
  getCurrentPriorityLevel,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority,
  NoPriority as NoSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  runWithPriority,
  scheduleCallback,
  cancelCallback,
  scheduleSyncCallback,
  requestPaint,
} from './SchedulerWithReactIntegration';
import {
  NoTimestamp,
  SyncLane,
  SyncBatchedLane,
  NoLanes,
  findUpdateLane,
  schedulerPriorityToLanePriority,
  InputDiscreteLanePriority,
  mergeLanes,
  markRootUpdated,
  markRootSuspended as markRootSuspendedDontCallThisOneDirectly,
  includesSomeLane,
  OffscreenLane,
  getNextLanes,
  markRootFinished,
  hasDiscreteLanes,
  markStarvedLanesAsExpired,
  returnNextLanesPriority,
  SyncLanePriority,
  lanePriorityToSchedulerPriority,
  SyncBatchedLanePriority,
} from './ReactFiberLane';
import { ConcurrentMode, BlockingMode, NoMode } from './ReactTypeOfMode';
import { requestCurrentTransition, NoTransition } from './ReactFiberTransition';
import { ContextOnlyDispatcher } from './ReactFiberHooks';
import { unwindInterruptedWork, unwindWork } from './ReactFiberUnwindWork';
import { createWorkInProgress } from './ReactFiber';
import { beginWork } from './ReactFiberBeginWork';
import {
  NoFlags,
  Incomplete,
  PerformedWork,
  HostEffectMask,
  Snapshot,
  Passive,
  Deletion,
  ContentReset,
  Ref,
  Placement,
  Update,
  Hydrating,
  PlacementAndUpdate,
  HydratingAndUpdate,
} from './ReactFiberFlags';
import { completeWork } from './ReactFiberCompleteWork';
import { LegacyRoot } from './ReactRootTags';
import {
  HostRoot,
  OffscreenComponent,
  LegacyHiddenComponent,
} from './ReactWorkTags';
import { resetContextDependencies } from './ReactFiberNewContext';
import {
  noTimeout,
  clearContainer,
  prepareForCommit,
  resetAfterCommit,
} from './ReactFiberHostConfig';
import ReactSharedInternals from '../../ReactSharedInternals';
import {
  commitBeforeMutationLifeCycles,
  commitResetTextContent,
  commitDetachRef,
  commitPlacement,
  commitWork,
} from './ReactFiberCommitWork';

const invariant = require('invariant');

const { ReactCurrentDispatcher, ReactCurrentOwner } = ReactSharedInternals;

const NoContext = 0b0000000;
const BatchedContext = 0b0000001;
const LegacyUnbatchedContext = 0b0001000;
const RenderContext = 0b0010000;
const CommitContext = 0b0100000;
const DiscreteEventContext = 0b0000100;
const RetryAfterError = 0b1000000;

const RootIncomplete = 0;
const RootErrored = 2;
const RootSuspendedWithDelay = 4;
const RootCompleted = 5;

let executionContext = NoContext;
let workInProgress = null;

let workInProgressRootRenderTargetTime = Infinity;
let workInProgressRootIncludedLanes = NoLanes;

let currentEventTime = NoTimestamp;
let currentEventWipLanes = NoLanes;

const RENDER_TIMEOUT_MS = 500;

const NESTED_UPDATE_LIMIT = 50;

let nestedPassiveUpdateCount = 0;
let nestedUpdateCount = 0;
let rootWithNestedUpdates = null;

let workInProgressRoot = null;
let workInProgressRootUpdatedLanes = NoLanes;
let workInProgressRootExitStatus = RootIncomplete;
let workInProgressRootRenderLanes = NoLanes;
let workInProgressRootPingedLanes = NoLanes;
let workInProgressRootSkippedLanes = NoLanes;

let subtreeRenderLanes = NoLanes;

let workInProgressRootFatalError = null;
let legacyErrorBoundariesThatAlreadyFailed = null;
let hasUncaughtError = false;
let firstUncaughtError = null;

let nextEffect = null;

let pendingPassiveEffectsRenderPriority = NoSchedulerPriority;
let rootWithPendingPassiveEffects = null;
let pendingPassiveEffectsLanes = NoLanes;
let rootDoesHavePassiveEffects = false;
let pendingPassiveHookEffectsUnmount = [];

let rootsWithPendingDiscreteUpdates = null;

let mostRecentlyUpdatedRoot = null;

const resetRenderTimer = () =>
  (workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS);

const unbatchedUpdates = (fn, a) => {
  const prevExecutionContext = executionContext;
  executionContext &= BatchedContext;
  executionContext |= LegacyUnbatchedContext;

  // executionContext: 8, prevExecutionContext: 0

  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
    if (executionContext === NoContext) {
      resetRenderTimer();
      flushSyncCallbackQueue();
    }
  }
};

const requestEventTime = () => {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    return now();

  if (currentEventTime !== NoTimestamp) return currentEventTime;

  currentEventTime = now();

  return currentEventTime;
};

const requestUpdateLane = (fiber) => {
  const { mode } = fiber;
  if ((mode & BlockingMode) === NoMode) return SyncLane;
  else if ((mode & ConcurrentMode) === NoMode)
    return getCurrentPriorityLevel() === ImmediateSchedulerPriority
      ? SyncLane
      : SyncBatchedLane;

  if (currentEventWipLanes === NoLanes) {
    currentEventWipLanes = workInProgressRootIncludedLanes;
  }

  const isTransition = requestCurrentTransition() !== NoTransition;

  if (isTransition) {
    // todo
  }

  const schedulerPriority = getCurrentPriorityLevel();
  let lane;

  if (
    (executionContext & DiscreteEventContext) !== NoContext &&
    schedulerPriority === UserBlockingPriority
  )
    lane = findUpdateLane(InputDiscreteLanePriority, currentEventWipLanes);
  else {
    const schedulerLanePriority =
      schedulerPriorityToLanePriority(schedulerPriority);

    lane = findUpdateLane(schedulerLanePriority, currentEventWipLanes);
  }

  return lane;
};

const checkForNestedUpdates = () => {
  if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
    nestedUpdateCount = 0;
    rootWithNestedUpdates = null;
    invariant(
      false,
      'Maximum update depth exceeded. This can happen when a component ' +
        'repeatedly calls setState inside componentWillUpdate or ' +
        'componentDidUpdate. React limits the number of nested updates to ' +
        'prevent infinite loops.'
    );
  }
};

const markUpdateLaneFromFiberToRoot = (sourceFiber, lane) => {
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let { alternate } = sourceFiber;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }

  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    }
    node = parent;
    parent = parent.return;
  }

  if (node.tag === HostRoot) {
    const root = node.stateNode;
    return root;
  } else {
    return null;
  }
};

const markRootSuspended = (root, suspendedLanes) => {
  suspendedLanes = removeLanes(suspendedLanes, workInProgressRootPingedLanes);
  suspendedLanes = removeLanes(suspendedLanes, workInProgressRootUpdatedLanes);

  markRootSuspendedDontCallThisOneDirectly(root, suspendedLanes);
};

const detachFiberAfterEffects = (fiber) => {
  fiber.sibling = null;
  fiber.stateNode = null;
};

const flushPassiveEffectsImpl = () => {
  if (rootWithPendingPassiveEffects === null) return false;

  const root = rootWithPendingPassiveEffects;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsLanes = NoLanes;

  invariant(
    (executionContext & (RenderContext | CommitContext)) === NoContext,
    'Cannot flush passive effects while already rendering.'
  );

  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;

  pendingPassiveHookEffectsUnmount = [];

  pendingPassiveHookEffectsMount = [];

  let effect = root.current.firstEffect;
  while (effect !== null) {
    const nextNextEffect = effect.nextEffect;
    effect.nextEffect = null;
    if (effect.flags & Deletion) {
      detachFiberAfterEffects(effect);
    }
    effect = nextNextEffect;
  }

  executionContext = prevExecutionContext;

  flushSyncCallbackQueue();

  nestedPassiveUpdateCount =
    rootWithPendingPassiveEffects === null ? 0 : nestedPassiveUpdateCount + 1;

  return true;
};

const flushPassiveEffects = () => {
  if (pendingPassiveEffectsRenderPriority !== NoSchedulerPriority) {
    const priorityLevel =
      pendingPassiveEffectsRenderPriority > NormalSchedulerPriority
        ? NormalSchedulerPriority
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = NoSchedulerPriority;

    return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
  }
  return false;
};

const pushDispatcher = () => {
  const prevDispatcher = ReactCurrentDispatcher.current;
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  if (prevDispatcher === null) {
    return ContextOnlyDispatcher;
  } else {
    return prevDispatcher;
  }
};

const popDispatcher = (prevDispatcher) => {
  ReactCurrentDispatcher.current = prevDispatcher;
};

const prepareFreshStack = (root, lanes) => {
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  const timeoutHandle = root.timeoutHandle;
  if (timeoutHandle !== noTimeout) {
    root.timeoutHandle = noTimeout;
    clearTimeout(timeoutHandle);
  }

  if (workInProgress !== null) {
    let interruptedWork = workInProgress.return;
    while (interruptedWork !== null) {
      unwindInterruptedWork(interruptedWork);
      interruptedWork = interruptedWork.return;
    }
  }

  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);

  workInProgressRootRenderLanes =
    subtreeRenderLanes =
    workInProgressRootIncludedLanes =
      lanes;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
};

const resetChildLanes = (completedWork) => {
  if (
    (completedWork.tag === LegacyHiddenComponent ||
      completedWork.tag === OffscreenComponent) &&
    completedWork.memoizedState !== null &&
    !includesSomeLane(subtreeRenderLanes, OffscreenLane) &&
    (completedWork.mode & ConcurrentMode) !== NoLanes
  )
    return;

  let newChildLanes = NoLanes;

  let child = completedWork.child;
  while (child !== null) {
    newChildLanes = mergeLanes(
      newChildLanes,
      mergeLanes(child.lanes, child.childLanes)
    );
    child = child.sibling;
  }

  completedWork.childLanes = newChildLanes;
};

const completeUnitOfWork = (unitOfWork) => {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;

    console.log(completedWork, '------completeUnitOfWork:completedWork');

    if ((completedWork.flags & Incomplete) === NoFlags) {
      const next = completeWork(current, completedWork, subtreeRenderLanes);
      console.log(next, '------completeUnitOfWork:next');

      if (next !== null) {
        workInProgress = next;
        return;
      }

      resetChildLanes(completedWork);

      if (
        returnFiber !== null &&
        (returnFiber.flags & Incomplete) === NoFlags
      ) {
        if (returnFiber.firstEffect === null) {
          returnFiber.firstEffect = completedWork.firstEffect;
        }
        if (completedWork.lastEffect !== null) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
          }
          returnFiber.lastEffect = completedWork.lastEffect;
        }

        const flags = completedWork.flags;

        if (flags > PerformedWork) {
          if (returnFiber.lastEffect !== null) {
            returnFiber.lastEffect.nextEffect = completedWork;
          } else {
            returnFiber.firstEffect = completedWork;
          }
          returnFiber.lastEffect = completedWork;
        }
      }
    } else {
      const next = unwindWork(completedWork, subtreeRenderLanes);

      if (next !== null) {
        next.flags &= HostEffectMask;
        workInProgress = next;
        return;
      }

      if (returnFiber !== null) {
        returnFiber.firstEffect = returnFiber.lastEffect = null;
        returnFiber.flags |= Incomplete;
      }
    }

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);

  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
};

const performUnitOfWork = (unitOfWork) => {
  const current = unitOfWork.alternate;

  console.log(unitOfWork, '--------performUnitOfWork(workInProgress)');
  const next = beginWork(current, unitOfWork, subtreeRenderLanes);
  console.log(next, '--------performUnitOfWork:next');

  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }

  ReactCurrentOwner.current = null;
};

const workLoopSync = () => {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
};

const handleError = () => {};

const commitBeforeMutationEffects = () => {
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    const flags = nextEffect.flags;
    if ((flags & Snapshot) !== NoFlags) {
      commitBeforeMutationLifeCycles(current, nextEffect);
    }
    if ((flags & Passive) !== NoFlags) {
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }

    nextEffect = nextEffect.nextEffect;
  }
};

const commitMutationEffects = (root, renderPriorityLevel) => {
  while (nextEffect !== null) {
    const flags = nextEffect.flags;

    if (flags & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
    }

    const primaryFlags = flags & (Placement | Update | Deletion | Hydrating);
    console.log(primaryFlags, '------commitMutationEffects:primaryFlags');
    switch (primaryFlags) {
      case Placement: {
        commitPlacement(nextEffect);

        nextEffect.flags &= ~Placement;
        break;
      }
      case PlacementAndUpdate: {
        commitPlacement(nextEffect);

        nextEffect.flags &= ~Placement;

        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Hydrating: {
        nextEffect.flags &= ~Hydrating;
        break;
      }
      case HydratingAndUpdate: {
        nextEffect.flags &= ~Hydrating;

        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }

    nextEffect = nextEffect.nextEffect;
  }
};

const commitLayoutEffects = (root, committedLanes) => {};

const commitRootImpl = (root, renderPriorityLevel) => {
  do {
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);

  console.log(executionContext, '------commitRootImpl:executionContext');

  invariant(
    (executionContext & (RenderContext | CommitContext)) === NoContext,
    'Should not already be working.'
  );

  const finishedWork = root.finishedWork;
  const lanes = root.finishedLanes;

  if (finishedWork === null) return null;

  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  invariant(
    finishedWork !== root.current,
    'Cannot commit the same tree as before. This error is likely caused by ' +
      'a bug in React. Please file an issue.'
  );

  root.callbackNode = null;

  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
  markRootFinished(root, remainingLanes);

  if (rootsWithPendingDiscreteUpdates !== null) {
    if (
      !hasDiscreteLanes(remainingLanes) &&
      rootsWithPendingDiscreteUpdates.has(root)
    ) {
      rootsWithPendingDiscreteUpdates.delete(root);
    }
  }

  if (root === workInProgressRoot) {
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  }

  let firstEffect;
  if (finishedWork.flags > PerformedWork) {
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    firstEffect = finishedWork.firstEffect;
  }

  if (firstEffect !== null) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;

    ReactCurrentOwner.current = null;

    prepareForCommit(root.containerInfo);

    nextEffect = firstEffect;

    do {
      try {
        commitBeforeMutationEffects();
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.');
        // captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    } while (nextEffect !== null);

    nextEffect = firstEffect;

    console.log({ ...nextEffect }, '------commitMutationEffects>nextEffect');

    do {
      try {
        commitMutationEffects(root, renderPriorityLevel);
      } catch (error) {
        invariant(nextEffect !== null, 'Should be working on an effect.');
        // captureCommitPhaseError(nextEffect, error);
        nextEffect = nextEffect.nextEffect;
      }
    } while (nextEffect !== null);

    resetAfterCommit(root.containerInfo);

    root.current = finishedWork;
    nextEffect = firstEffect;

    // do {
    //   try {
    //     commitLayoutEffects(root, lanes);
    //   } catch (error) {
    //     invariant(nextEffect !== null, 'Should be working on an effect.');

    //     nextEffect = nextEffect.nextEffect;
    //   }
    // } while (nextEffect !== null);

    nextEffect = null;

    requestPaint();

    executionContext = prevExecutionContext;
  } else {
    root.current = finishedWork;
  }

  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

  if (rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = false;
    rootWithPendingPassiveEffects = root;
    pendingPassiveEffectsLanes = lanes;
    pendingPassiveEffectsRenderPriority = renderPriorityLevel;
  } else {
    nextEffect = firstEffect;
    while (nextEffect !== null) {
      const nextNextEffect = nextEffect.nextEffect;
      nextEffect.nextEffect = null;
      if (nextEffect.flags & Deletion) {
        detachFiberAfterEffects(nextEffect);
      }
      nextEffect = nextNextEffect;
    }
  }

  remainingLanes = root.pendingLanes;

  legacyErrorBoundariesThatAlreadyFailed = null;

  if (remainingLanes === SyncLane) {
    if (root === rootWithNestedUpdates) {
      nestedUpdateCount++;
    } else {
      nestedUpdateCount = 0;
      rootWithNestedUpdates = root;
    }
  } else {
    nestedUpdateCount = 0;
  }

  ensureRootIsScheduled(root, now());

  if (hasUncaughtError) {
    hasUncaughtError = false;
    const error = firstUncaughtError;
    firstUncaughtError = null;
    throw error;
  }

  if ((executionContext & LegacyUnbatchedContext) !== NoContext) return null;

  flushSyncCallbackQueue();

  return null;
};

const commitRoot = (root) => {
  const renderPriorityLevel = getCurrentPriorityLevel();
  console.log(renderPriorityLevel, '------commitRoot:renderPriorityLevel');
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel)
  );
  return null;
};

const renderRootSync = (root, lanes) => {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher();

  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
  }

  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);

  resetContextDependencies();
  executionContext = prevExecutionContext;

  popDispatcher(prevDispatcher);

  if (workInProgress !== null) {
    invariant(
      false,
      'Cannot commit an incomplete root. This error is likely caused by a ' +
        'bug in React. Please file an issue.'
    );
  }

  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;

  return workInProgressRootExitStatus;
};

const ensureRootIsScheduled = (root, currentTime) => {
  const existingCallbackNode = root.callbackNode;

  markStarvedLanesAsExpired(root, currentTime);

  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );
  const newCallbackPriority = returnNextLanesPriority();

  if (nextLanes === NoLanes) {
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
      root.callbackNode = null;
      root.callbackPriority = NoLanePriority;
    }
    return;
  }

  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    if (existingCallbackPriority === newCallbackPriority) return;

    cancelCallback(existingCallbackNode);
  }

  let newCallbackNode;
  if (newCallbackPriority === SyncLanePriority) {
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root)
    );
  } else if (newCallbackPriority === SyncBatchedLanePriority) {
    newCallbackNode = scheduleCallback(
      ImmediateSchedulerPriority,
      performSyncWorkOnRoot.bind(null, root)
    );
  } else {
    const schedulerPriorityLevel =
      lanePriorityToSchedulerPriority(newCallbackPriority);
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
};

const performSyncWorkOnRoot = (root) => {
  invariant(
    (executionContext & (RenderContext | CommitContext)) === NoContext,
    'Should not already be working.'
  );

  flushPassiveEffects();

  let lanes;
  let exitStatus;
  if (
    root === workInProgressRoot &&
    includesSomeLane(root.expiredLanes, workInProgressRootRenderLanes)
  ) {
    lanes = workInProgressRootRenderLanes;
    exitStatus = renderRootSync(root, lanes);
    if (
      includesSomeLane(
        workInProgressRootIncludedLanes,
        workInProgressRootUpdatedLanes
      )
    ) {
      lanes = getNextLanes(root, lanes);
      exitStatus = renderRootSync(root, lanes);
    }
  } else {
    lanes = getNextLanes(root, NoLanes);
    exitStatus = renderRootSync(root, lanes);
  }

  if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
    executionContext |= RetryAfterError;

    if (root.hydrate) {
      root.hydrate = false;
      clearContainer(root.containerInfo);
    }
  }

  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;

  console.log({ ...root }, '------performSyncWorkOnRoot>commitRoot(root)');
  commitRoot(root);

  ensureRootIsScheduled(root, now());

  return null;
};

const scheduleUpdateOnFiber = (fiber, lane, eventTime) => {
  checkForNestedUpdates();

  const root = markUpdateLaneFromFiberToRoot(fiber, lane);

  if (root === null) return null;

  markRootUpdated(root, lane, eventTime);

  if (root === workInProgressRoot) {
    if ((executionContext & RenderContext) === NoContext) {
      workInProgressRootUpdatedLanes = mergeLanes(
        workInProgressRootUpdatedLanes,
        lane
      );
    }
    if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
      markRootSuspended(root, workInProgressRootRenderLanes);
    }
  }

  if (lane === SyncLane) {
    if (
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      performSyncWorkOnRoot(root);
    } else {
      ensureRootIsScheduled(root, eventTime);
      if (executionContext === NoContext) {
        resetRenderTimer();
        flushSyncCallbackQueue();
      }
    }
  } else {
    if (
      (executionContext & DiscreteEventContext) !== NoContext &&
      (priorityLevel === UserBlockingSchedulerPriority ||
        priorityLevel === ImmediateSchedulerPriority)
    ) {
      if (rootsWithPendingDiscreteUpdates === null) {
        rootsWithPendingDiscreteUpdates = new Set([root]);
      } else {
        rootsWithPendingDiscreteUpdates.add(root);
      }
    }
    ensureRootIsScheduled(root, eventTime);
  }

  mostRecentlyUpdatedRoot = root;
};

const markSkippedUpdateLanes = (lane) => {
  workInProgressRootSkippedLanes = mergeLanes(
    lane,
    workInProgressRootSkippedLanes
  );
};

const performConcurrentWorkOnRoot = (root) => {};

export {
  NoContext,
  RetryAfterError,
  unbatchedUpdates,
  requestEventTime,
  requestUpdateLane,
  flushPassiveEffects,
  scheduleUpdateOnFiber,
  markSkippedUpdateLanes,
};
