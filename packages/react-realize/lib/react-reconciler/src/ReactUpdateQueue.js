import { NoLane, NoLanes, isSubsetOfLanes, mergeLanes } from './ReactFiberLane';
import { Callback, ShouldCapture, DidCapture } from './ReactFiberFlags';
import { markSkippedUpdateLanes } from './ReactFiberWorkLoop';

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

let hasForceUpdate = false;

export const createUpdate = (eventTime, lane) => {
  const update = {
    eventTime,
    lane,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
};

export const initializeUpdateQueue = (fiber) => {
  const queue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };

  fiber.updateQueue = queue;
};

export const enqueueUpdate = (fiber, update) => {
  const { updateQueue } = fiber;

  if (!updateQueue) return;

  const sharedQueue = updateQueue.shared;
  const { pending } = sharedQueue;

  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
};

export const cloneUpdateQueue = (current, workInProgress) => {
  const queue = workInProgress.updateQueue;
  const currentQueue = current.updateQueue;
  if (queue === currentQueue) {
    const clone = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared,
      effects: currentQueue.effects,
    };
    workInProgress.updateQueue = clone;
  }
};

const getStateFromUpdate = (
  workInProgress,
  queue,
  update,
  prevState,
  nextProps,
  instance
) => {
  switch (update.tag) {
    case ReplaceState: {
      const payload = update.payload;
      if (typeof payload === 'function') {
        const nextState = payload.call(instance, prevState, nextProps);
        return nextState;
      }
      return payload;
    }
    case CaptureUpdate: {
      workInProgress.flags =
        (workInProgress.flags & ~ShouldCapture) | DidCapture;
    }
    case UpdateState: {
      const payload = update.payload;
      let partialState;
      if (typeof payload === 'function') {
        partialState = payload.call(instance, prevState, nextProps);
      } else {
        partialState = payload;
      }
      if (partialState === null || partialState === undefined) {
        return prevState;
      }

      return Object.assign({}, prevState, partialState);
    }
    case ForceUpdate: {
      hasForceUpdate = true;
      return prevState;
    }
  }
  return prevState;
};

export const processUpdateQueue = (
  workInProgress,
  props,
  instance,
  renderLanes
) => {
  const queue = workInProgress.updateQueue;

  console.log(
    { ...queue },
    '------processUpdateQueue(workInProgress.updateQueue)'
  );

  hasForceUpdate = false;

  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;

  let pendingQueue = queue.shared.pending;
  console.log({ ...pendingQueue }, '------processUpdateQueue: pendingQueue');
  
  if (pendingQueue !== null) {
    queue.shared.pending = null;

    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;

    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    const current = workInProgress.alternate;
    if (current !== null) {
      const currentQueue = current.updateQueue;
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate;
      }
    }

    if (firstBaseUpdate !== null) {
      let newState = queue.baseState;
      let newLanes = NoLanes;

      let newBaseState = null;
      let newFirstBaseUpdate = null;
      let newLastBaseUpdate = null;

      let update = firstBaseUpdate;
      do {
        const updateLane = update.lane;
        const updateEventTime = update.eventTime;

        console.log(renderLanes, updateLane, '-------renderLanes,updateLane')
        if (!isSubsetOfLanes(renderLanes, updateLane)) {
          const clone = {
            eventTime: updateEventTime,
            lane: updateLane,

            tag: update.tag,
            payload: update.payload,
            callback: update.callback,

            next: null,
          };
          if (newLastBaseUpdate === null) {
            newFirstBaseUpdate = newLastBaseUpdate = clone;
            newBaseState = newState;
          } else {
            newLastBaseUpdate = newLastBaseUpdate.next = clone;
          }
          newLanes = mergeLanes(newLanes, updateLane);
        } else {
          if (newLastBaseUpdate !== null) {
            const clone = {
              eventTime: updateEventTime,

              lane: NoLane,

              tag: update.tag,
              payload: update.payload,
              callback: update.callback,

              next: null,
            };
            newLastBaseUpdate = newLastBaseUpdate.next = clone;
          }

          newState = getStateFromUpdate(
            workInProgress,
            queue,
            update,
            newState,
            props,
            instance
          );
          const callback = update.callback;
          if (callback !== null) {
            workInProgress.flags |= Callback;
            const effects = queue.effects;
            if (effects === null) {
              queue.effects = [update];
            } else {
              effects.push(update);
            }
          }
        }
        update = update.next;
        if (update === null) {
          pendingQueue = queue.shared.pending;
          if (pendingQueue === null) {
            break;
          } else {
            const lastPendingUpdate = pendingQueue;
            const firstPendingUpdate = lastPendingUpdate.next;
            lastPendingUpdate.next = null;
            update = firstPendingUpdate;
            queue.lastBaseUpdate = lastPendingUpdate;
            queue.shared.pending = null;
          }
        }
      } while (true);

      if (newLastBaseUpdate === null) {
        newBaseState = newState;
      }

      queue.baseState = newBaseState;
      queue.firstBaseUpdate = newFirstBaseUpdate;
      queue.lastBaseUpdate = newLastBaseUpdate;

      markSkippedUpdateLanes(newLanes);
      workInProgress.lanes = newLanes;
      workInProgress.memoizedState = newState;
    }
  }
};

export const resetHasForceUpdateBeforeProcessing = () => {
  hasForceUpdate = false;
};

export const checkHasForceUpdateAfterProcessing = () => hasForceUpdate;
