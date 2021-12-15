export const UpdateState = 0;

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
    baseState: fiber.memorizedState,
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
