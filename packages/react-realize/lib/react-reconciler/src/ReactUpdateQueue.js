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
