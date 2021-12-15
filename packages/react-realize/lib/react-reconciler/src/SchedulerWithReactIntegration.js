import Scheduler from '../../scheduler';

let immediateQueueCallbackNode = null;

export const ImmediatePriority = 99;
export const UserBlockingPriority = 98;
export const NormalPriority = 97;
export const LowPriority = 96;
export const IdlePriority = 95;
export const NoPriority = 90;

const initialTimeMs = Date.now();

export const now =
  initialTimeMs < 10000 ? () => Date.now() : () => Date.now() - initialTimeMs;

const reactPriorityToSchedulerPriority = (reactPriorityLevel) => {
  switch (reactPriorityLevel) {
    case ImmediatePriority:
      return Scheduler.ImmediatePriority;
    case UserBlockingPriority:
      return Scheduler.UserBlockingPriority;
    case NormalPriority:
      return Scheduler.NormalPriority;
    case LowPriority:
      return Scheduler.LowPriority;
    case IdlePriority:
      return Scheduler.IdlePriority;
    default:
      throw new Error('Unknown priority level.');
  }
};

export const runWithPriority = (reactPriorityLevel, fn) => {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler.runWithPriority(priorityLevel, fn);
};

const flushSyncCallbackQueueImpl = () => {};

export const flushSyncCallbackQueue = () => {
  if (immediateQueueCallbackNode !== null) {
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler.cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
};

export const getCurrentPriorityLevel = () => {
  switch (Scheduler.getCurrentPriorityLevel()) {
    case Scheduler.ImmediatePriority:
      return ImmediatePriority;
    case Scheduler.UserBlockingPriority:
      return UserBlockingPriority;
    case Scheduler.NormalPriority:
      return NormalPriority;
    case Scheduler.LowPriority:
      return LowPriority;
    case Scheduler.IdlePriority:
      return IdlePriority;
    default:
      throw new Error('Unknown priority level.');
  }
};
