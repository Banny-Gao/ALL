const isSuspenseBoundaryBeingHidden = (current, finishedWork) => {
  if (current !== null) {
    const oldState = current.memoizedState;
    if (oldState === null || oldState.dehydrated !== null) {
      const newState = finishedWork.memoizedState;
      return newState !== null && newState.dehydrated === null;
    }
  }
  return false;
};

const commitBeforeMutationLifeCycles = (current, finishedWork) => {};

export { isSuspenseBoundaryBeingHidden, commitBeforeMutationLifeCycles };
