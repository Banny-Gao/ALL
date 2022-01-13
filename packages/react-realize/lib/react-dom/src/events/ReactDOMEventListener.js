import {
  DiscreteEvent,
  UserBlockingEvent,
  ContinuousEvent,
} from '../../../ReactTypes';

import { getEventPriorityForPluginSystem } from './DOMEventProperties';

let _enabled = true;

const setEnabled = (enabled) => {
  _enabled = !!enabled;
};

const isEnabled = () => _enabled;

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

const createEventListenerWrapperWithPriority = (
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

export {
  _enabled,
  setEnabled,
  isEnabled,
  createEventListenerWrapperWithPriority,
};
