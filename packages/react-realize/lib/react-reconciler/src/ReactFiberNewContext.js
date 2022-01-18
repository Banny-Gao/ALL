import { includesSomeLane } from './ReactFiberLane';
import { markWorkInProgressReceivedUpdate } from './ReactFiberBeginWork';

let currentlyRenderingFiber = null;
let lastContextDependency = null;
let lastContextWithAllBitsObserved = null;

const resetContextDependencies = () => {
  currentlyRenderingFiber = null;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;
};

const prepareToReadContext = (workInProgress, renderLanes) => {
  currentlyRenderingFiber = workInProgress;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;

  const dependencies = workInProgress.dependencies;
  if (dependencies !== null) {
    const firstContext = dependencies.firstContext;
    if (firstContext !== null) {
      if (includesSomeLane(dependencies.lanes, renderLanes)) {
        markWorkInProgressReceivedUpdate();
      }

      dependencies.firstContext = null;
    }
  }
};

const readContext = (context, observedBits) => {};

export { resetContextDependencies, readContext, prepareToReadContext };
