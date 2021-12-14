import { ContinuousEvent } from '../../../ReactTypes';

const eventPriorities = new Map();

export const getEventPriorityForPluginSystem = (domEventName) => {
  const priority = eventPriorities.get(domEventName);

  return priority === undefined ? ContinuousEvent : priority;
};
