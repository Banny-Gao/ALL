import {
  flushSyncCallbackQueue,
  now,
  getCurrentPriorityLevel,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority,
  NoPriority as NoSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  runWithPriority,
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
} from './ReactFiberFlags';
import { completeWork } from './ReactFiberCompleteWork';
import { LegacyRoot } from './ReactRootTags';

import {
  HostRoot,
  IndeterminateComponent,
  ClassComponent,
  SuspenseComponent,
  SuspenseListComponent,
  FunctionComponent,
  ForwardRef,
  MemoComponent,
  SimpleMemoComponent,
  Block,
  OffscreenComponent,
  LegacyHiddenComponent,
  ScopeComponent,
} from './ReactWorkTags';
import { resetContextDependencies } from './ReactFiberNewContext';

import { noTimeout, clearContainer } from './ReactFiberHostConfig';

import ReactSharedInternals from '../../ReactSharedInternals';

const invariant = require('invariant');

const { ReactCurrentDispatcher, ReactCurrentOwner, IsSomeRendererActing } =
  ReactSharedInternals;

export const NoContext = 0b0000000;
const BatchedContext = 0b0000001;
const LegacyUnbatchedContext = 0b0001000;
const RenderContext = 0b0010000;
const CommitContext = 0b0100000;
const DiscreteEventContext = 0b0000100;
export const RetryAfterError = 0b1000000;

const RootIncomplete = 0;
const RootFatalErrored = 1;
const RootErrored = 2;
const RootSuspended = 3;
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

let pendingPassiveEffectsRenderPriority = NoSchedulerPriority;

const resetRenderTimer = () =>
  (workInProgressRootRenderTargetTime = now() + RENDER_TIMEOUT_MS);

export const unbatchedUpdates = (fn, a) => {
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

export const requestEventTime = () => {
  if ((executionContext & (RenderContext | CommitContext)) !== NoContext)
    return now();

  if (currentEventTime !== NoTimestamp) return currentEventTime;

  currentEventTime = now();

  return currentEventTime;
};

export const requestUpdateLane = (fiber) => {
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

export const flushPassiveEffects = () => {
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
  ) {
    return;
  }

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

    if ((completedWork.flags & Incomplete) === NoFlags) {
      const next = completeWork(current, completedWork, subtreeRenderLanes);

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

  console.log(unitOfWork, '----------performUnitOfWork(workInProgress)');
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

const handleError = (root, thrownValue) => {};

const renderRootSync = (root, lanes) => {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher();

  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
  }

  // do {
  //   try {
  workLoopSync();
  //     break;
  //   } catch (thrownValue) {
  //     handleError(root, thrownValue);
  //   }
  // } while (true);

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

  // if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
  //   executionContext |= RetryAfterError;

  //   if (root.hydrate) {
  //     root.hydrate = false;
  //     clearContainer(root.containerInfo);
  //   }
  // }
};

export const scheduleUpdateOnFiber = (fiber, lane, eventTime) => {
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

  const priorityLevel = getCurrentPriorityLevel();

  if (lane === SyncLane) {
    if (
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      performSyncWorkOnRoot(root);
    } else {
      //
    }
  }
};

export const markSkippedUpdateLanes = (lane) => {
  workInProgressRootSkippedLanes = mergeLanes(
    lane,
    workInProgressRootSkippedLanes
  );
};
