import Scheduler from '../../scheduler';

let immediateQueueCallbackNode = null;
let isFlushingSyncQueue = false;
let syncQueue = null;

export const ImmediatePriority = 99;
export const UserBlockingPriority = 98;
export const NormalPriority = 97;
export const LowPriority = 96;
export const IdlePriority = 95;
export const NoPriority = 90;

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
      invariant(false, 'Unknown priority level.');
  }
};

export const runWithPriority = (reactPriorityLevel, fn) => {
  const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
  return Scheduler.runWithPriority(priorityLevel, fn);
};

const flushSyncCallbackQueueImpl = () => {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    isFlushingSyncQueue = true;

    let i = 0;

    try {
      const isSync = true;
      const queue = syncQueue;
      runWithPriority(ImmediatePriority, () => {
        for (; i < queue.length; i++) {
          let callback = queue[i];
          do {
            callback = callback(isSync);
          } while (callback !== null);
        }
      });
      syncQueue = null;
    } catch (error) {
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1);
      }
      Scheduler.scheduleCallback(
        Scheduler_ImmediatePriority,
        flushSyncCallbackQueue
      );
      throw error;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
};

export const flushSyncCallbackQueue = () => {
  if (immediateQueueCallbackNode !== null) {
    const node = immediateQueueCallbackNode;
    immediateQueueCallbackNode = null;
    Scheduler.cancelCallback(node);
  }
  flushSyncCallbackQueueImpl();
};
