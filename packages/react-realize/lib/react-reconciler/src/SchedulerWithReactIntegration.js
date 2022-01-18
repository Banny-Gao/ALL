import Scheduler from '../../scheduler';

const fakeCallbackNode = {};

const ImmediatePriority = 99;
const UserBlockingPriority = 98;
const NormalPriority = 97;
const LowPriority = 96;
const IdlePriority = 95;
const NoPriority = 90;

let syncQueue = null;
let immediateQueueCallbackNode = null;
let isFlushingSyncQueue = false;

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
        Scheduler.ImmediatePriority,
        flushSyncCallbackQueue
      );
      throw error;
    } finally {
      isFlushingSyncQueue = false;
    }
  }
};

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

const scheduleSyncCallback = (callback) => {
  if (syncQueue === null) {
    syncQueue = [callback];
    immediateQueueCallbackNode = Scheduler.scheduleCallback(
      Scheduler.ImmediatePriority,
      flushSyncCallbackQueueImpl
    );
  } else {
    syncQueue.push(callback);
  }
  return fakeCallbackNode;
};

const cancelCallback = (callbackNode) => {
  if (callbackNode !== fakeCallbackNode) {
    Scheduler.cancelCallback(callbackNode);
  }
};

const requestPaint =
  Scheduler.requestPaint !== undefined ? Scheduler.requestPaint : () => {};

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
  scheduleSyncCallback,
  cancelCallback,
  requestPaint,
};
