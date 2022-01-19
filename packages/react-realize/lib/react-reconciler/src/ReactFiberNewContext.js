import { includesSomeLane, NoLanes } from './ReactFiberLane';
import { markWorkInProgressReceivedUpdate } from './ReactFiberBeginWork';

const invariant = require('invariant');

const MAX_SIGNED_31_BIT_INT = 1073741823;

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

const readContext = (context, observedBits) => {
  if (lastContextWithAllBitsObserved === context) {
    // Nothing to do. We already observe everything in this context.
  } else if (observedBits === false || observedBits === 0) {
    // Do not observe any updates.
  } else {
    let resolvedObservedBits;
    if (
      typeof observedBits !== 'number' ||
      observedBits === MAX_SIGNED_31_BIT_INT
    ) {
      lastContextWithAllBitsObserved = context;
      resolvedObservedBits = MAX_SIGNED_31_BIT_INT;
    } else {
      resolvedObservedBits = observedBits;
    }

    const contextItem = {
      context: context,
      observedBits: resolvedObservedBits,
      next: null,
    };

    if (lastContextDependency === null) {
      invariant(
        currentlyRenderingFiber !== null,
        'Context can only be read while React is rendering. ' +
          'In classes, you can read it in the render method or getDerivedStateFromProps. ' +
          'In function components, you can read it directly in the function body, but not ' +
          'inside Hooks like useReducer() or useMemo().'
      );

      lastContextDependency = contextItem;
      currentlyRenderingFiber.dependencies = {
        lanes: NoLanes,
        firstContext: contextItem,
        responders: null,
      };
    } else {
      lastContextDependency = lastContextDependency.next = contextItem;
    }
  }
  return context._currentValue;
};

export { resetContextDependencies, readContext, prepareToReadContext };
