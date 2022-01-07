import {
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  LowPriority as LowSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  NoPriority as NoSchedulerPriority,
} from './SchedulerWithReactIntegration';

export const SyncLanePriority = 15;
export const SyncBatchedLanePriority = 14;

const InputDiscreteHydrationLanePriority = 13;
export const InputDiscreteLanePriority = 12;

const InputContinuousHydrationLanePriority = 11;
export const InputContinuousLanePriority = 10;

const DefaultHydrationLanePriority = 9;
export const DefaultLanePriority = 8;

const TransitionHydrationPriority = 7;
export const TransitionPriority = 6;

const RetryLanePriority = 5;

const SelectiveHydrationLanePriority = 4;

const IdleHydrationLanePriority = 3;
const IdleLanePriority = 2;

const OffscreenLanePriority = 1;

export const NoLanePriority = 0;

export const createLaneMap = (initial) =>
  Array(31)
    .fill(0)
    .map(() => initial);

export const NoLanes = 0b0000000000000000000000000000000;
export const NoLane = 0b0000000000000000000000000000000;

export const SyncLane = 0b0000000000000000000000000000001;
export const SyncBatchedLane = 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane = 0b0000000000000000000000000000100;
const InputDiscreteLanes = 0b0000000000000000000000000011000;

const InputContinuousHydrationLane = 0b0000000000000000000000000100000;
const InputContinuousLanes = 0b0000000000000000000000011000000;

export const DefaultHydrationLane = 0b0000000000000000000000100000000;
export const DefaultLanes = 0b0000000000000000000111000000000;

const TransitionHydrationLane = 0b0000000000000000001000000000000;
const TransitionLanes = 0b0000000001111111110000000000000;

export const IdleHydrationLane = 0b0001000000000000000000000000000;
const IdleLanes = 0b0110000000000000000000000000000;
const NonIdleLanes = 0b0000111111111111111111111111111;

export const OffscreenLane = 0b1000000000000000000000000000000;

export const NoTimestamp = -1;

const getHighestPriorityLane = (lanes) => lanes & -lanes;

export const pickArbitraryLane = (lanes) => getHighestPriorityLane(lanes);

export const findUpdateLane = (lanePriority, wipLanes) => {
  let lane;
  switch (lanePriority) {
    case NoLanePriority:
      break;
    case SyncLanePriority:
      return SyncLane;
    case SyncBatchedLanePriority:
      return SyncBatchedLane;
    case InputDiscreteLanePriority: {
      lane = pickArbitraryLane(InputDiscreteLanes & ~wipLanes);
      if (lane === NoLane) {
        return findUpdateLane(InputContinuousLanePriority, wipLanes);
      }
      return lane;
    }
    case InputContinuousLanePriority: {
      lane = pickArbitraryLane(InputContinuousLanes & ~wipLanes);
      if (lane === NoLane) {
        return findUpdateLane(DefaultLanePriority, wipLanes);
      }
      return lane;
    }
    case DefaultLanePriority: {
      lane = pickArbitraryLane(DefaultLanes & ~wipLanes);
      if (lane === NoLane) {
        lane = pickArbitraryLane(TransitionLanes & ~wipLanes);
        if (lane === NoLane) {
          lane = pickArbitraryLane(DefaultLanes);
        }
      }
      return lane;
    }
    case TransitionPriority:
    case RetryLanePriority:
      break;
    case IdleLanePriority:
      lane = pickArbitraryLane(IdleLanes & ~wipLanes);
      if (lane === NoLane) {
        lane = pickArbitraryLane(IdleLanes);
      }
      return lane;
    default:
      break;
  }

  throw new Error('Invalid update priority: %s. This is a bug in React.');
};

export const schedulerPriorityToLanePriority = (schedulerPriorityLevel) => {
  switch (schedulerPriorityLevel) {
    case ImmediateSchedulerPriority:
      return SyncLanePriority;
    case UserBlockingSchedulerPriority:
      return InputContinuousLanePriority;
    case NormalSchedulerPriority:
    case LowSchedulerPriority:
      return DefaultLanePriority;
    case IdleSchedulerPriority:
      return IdleLanePriority;
    default:
      return NoLanePriority;
  }
};

export const isSubsetOfLanes = (set, subset) => (set & subset) === subset;

export const mergeLanes = (a, b) => a | b;

const pickArbitraryLaneIndex = (lane) => 31 - Math.clz32(lane);

export const markRootUpdated = (root, updateLane, eventTime) => {
  root.pendingLanes |= updateLane;

  const higherPriorityLanes = updateLane - 1;

  root.suspendedLanes &= higherPriorityLanes;
  root.pingedLanes &= higherPriorityLanes;

  const eventTimes = root.eventTimes;
  const index = pickArbitraryLaneIndex(updateLane);

  eventTimes[index] = eventTime;
};

export const markRootSuspended = (root, suspendedLanes) => {
  root.suspendedLanes |= suspendedLanes;
  root.pingedLanes &= ~suspendedLanes;

  const expirationTimes = root.expirationTimes;

  let lanes = suspendedLanes;
  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;

    expirationTimes[index] = NoTimestamp;

    lanes &= ~lane;
  }
};

export const includesSomeLane = (a, b) => (a & b) !== NoLanes;

let return_highestLanePriority = DefaultLanePriority;

const getHighestPriorityLanes = (lanes) => {
  if ((SyncLane & lanes) !== NoLanes) {
    return_highestLanePriority = SyncLanePriority;
    return SyncLane;
  }
  if ((SyncBatchedLane & lanes) !== NoLanes) {
    return_highestLanePriority = SyncBatchedLanePriority;
    return SyncBatchedLane;
  }
  if ((InputDiscreteHydrationLane & lanes) !== NoLanes) {
    return_highestLanePriority = InputDiscreteHydrationLanePriority;
    return InputDiscreteHydrationLane;
  }
  const inputDiscreteLanes = InputDiscreteLanes & lanes;
  if (inputDiscreteLanes !== NoLanes) {
    return_highestLanePriority = InputDiscreteLanePriority;
    return inputDiscreteLanes;
  }
  if ((lanes & InputContinuousHydrationLane) !== NoLanes) {
    return_highestLanePriority = InputContinuousHydrationLanePriority;
    return InputContinuousHydrationLane;
  }
  const inputContinuousLanes = InputContinuousLanes & lanes;
  if (inputContinuousLanes !== NoLanes) {
    return_highestLanePriority = InputContinuousLanePriority;
    return inputContinuousLanes;
  }
  if ((lanes & DefaultHydrationLane) !== NoLanes) {
    return_highestLanePriority = DefaultHydrationLanePriority;
    return DefaultHydrationLane;
  }
  const defaultLanes = DefaultLanes & lanes;
  if (defaultLanes !== NoLanes) {
    return_highestLanePriority = DefaultLanePriority;
    return defaultLanes;
  }
  if ((lanes & TransitionHydrationLane) !== NoLanes) {
    return_highestLanePriority = TransitionHydrationPriority;
    return TransitionHydrationLane;
  }
  const transitionLanes = TransitionLanes & lanes;
  if (transitionLanes !== NoLanes) {
    return_highestLanePriority = TransitionPriority;
    return transitionLanes;
  }
  const retryLanes = RetryLanes & lanes;
  if (retryLanes !== NoLanes) {
    return_highestLanePriority = RetryLanePriority;
    return retryLanes;
  }
  if (lanes & SelectiveHydrationLane) {
    return_highestLanePriority = SelectiveHydrationLanePriority;
    return SelectiveHydrationLane;
  }
  if ((lanes & IdleHydrationLane) !== NoLanes) {
    return_highestLanePriority = IdleHydrationLanePriority;
    return IdleHydrationLane;
  }
  const idleLanes = IdleLanes & lanes;
  if (idleLanes !== NoLanes) {
    return_highestLanePriority = IdleLanePriority;
    return idleLanes;
  }
  if ((OffscreenLane & lanes) !== NoLanes) {
    return_highestLanePriority = OffscreenLanePriority;
    return OffscreenLane;
  }

  return_highestLanePriority = DefaultLanePriority;
  return lanes;
};

const getLowestPriorityLane = (lanes) => {
  const index = 31 - Math.clz32(lanes);
  return index < 0 ? NoLanes : 1 << index;
};

export const getNextLanes = (root, wipLanes) => {
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return_highestLanePriority = NoLanePriority;
    return NoLanes;
  }

  let nextLanes = NoLanes;
  let nextLanePriority = NoLanePriority;

  const expiredLanes = root.expiredLanes;
  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;

  if (expiredLanes !== NoLanes) {
    nextLanes = expiredLanes;
    nextLanePriority = return_highestLanePriority = SyncLanePriority;
  } else {
    const nonIdlePendingLanes = pendingLanes & NonIdleLanes;
    if (nonIdlePendingLanes !== NoLanes) {
      const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
      if (nonIdleUnblockedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
        nextLanePriority = return_highestLanePriority;
      } else {
        const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
        if (nonIdlePingedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
          nextLanePriority = return_highestLanePriority;
        }
      }
    } else {
      const unblockedLanes = pendingLanes & ~suspendedLanes;
      if (unblockedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(unblockedLanes);
        nextLanePriority = return_highestLanePriority;
      } else {
        if (pingedLanes !== NoLanes) {
          nextLanes = getHighestPriorityLanes(pingedLanes);
          nextLanePriority = return_highestLanePriority;
        }
      }
    }
  }

  if (nextLanes === NoLanes) {
    return NoLanes;
  }

  nextLanes = pendingLanes & ((getLowestPriorityLane(nextLanes) << 1) - 1);

  if (
    wipLanes !== NoLanes &&
    wipLanes !== nextLanes &&
    (wipLanes & suspendedLanes) === NoLanes
  ) {
    getHighestPriorityLanes(wipLanes);
    const wipLanePriority = return_highestLanePriority;
    if (nextLanePriority <= wipLanePriority) {
      return wipLanes;
    } else {
      return_highestLanePriority = nextLanePriority;
    }
  }

  const entangledLanes = root.entangledLanes;
  if (entangledLanes !== NoLanes) {
    const entanglements = root.entanglements;
    let lanes = nextLanes & entangledLanes;
    while (lanes > 0) {
      const index = pickArbitraryLaneIndex(lanes);
      const lane = 1 << index;

      nextLanes |= entanglements[index];

      lanes &= ~lane;
    }
  }

  return nextLanes;
};
