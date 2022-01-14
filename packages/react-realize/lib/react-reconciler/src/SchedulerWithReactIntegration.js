import Scheduler from '../../scheduler';

let immediateQueueCallbackNode = null;

const ImmediatePriority = 99;
const UserBlockingPriority = 98;
const NormalPriority = 97;
const LowPriority = 96;
const IdlePriority = 95;
const NoPriority = 90;

const initialTimeMs = Date.now();

const now =
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

const runWithPriority = (reactPriorityLevel, fn) => {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler.runWithPriority(priorityLevel, fn);
};

const flushSyncCallbackQueueImpl = () => {};

const flushSyncCallbackQueue = () => {
  if (immediateQueueCallbackNode !== null) {
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler.cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
};

const getCurrentPriorityLevel = () => {
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

const scheduleCallback = (reactPriorityLevel, callback, options) => {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler.scheduleCallback(priorityLevel, callback, options);
};

export {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  NoPriority,
  now,
  runWithPriority,
  flushSyncCallbackQueue,
  getCurrentPriorityLevel,
  scheduleCallback,
};
