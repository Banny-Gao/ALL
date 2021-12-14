import {
  DiscreteEvent,
  UserBlockingEvent,
  ContinuousEvent,
} from '../../../ReactTypes';

import { getEventPriorityForPluginSystem } from './DOMEventProperties';

const dispatchDiscreteEvent = (
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) => {};
const dispatchUserBlockingUpdate = (
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) => {};
const dispatchEvent = (
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) => {};

export const createEventListenerWrapperWithPriority = (
  targetContainer,
  domEventName,
  eventSystemFlags
) => {
  const eventPriority = getEventPriorityForPluginSystem(domEventName);
  let listenerWrapper;

  switch (eventPriority) {
    case DiscreteEvent:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case UserBlockingEvent:
      listenerWrapper = dispatchUserBlockingUpdate;
      break;
    case ContinuousEvent:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }

  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
};
