export const addEventCaptureListenerWithPassiveFlag = (
  target,
  eventType,
  listener,
  passive
) => {
  target.addEventListener(eventType, listener, {
    capture: true,
    passive,
  });
  return listener;
};

export const addEventCaptureListener = (target, eventType, listener) => {
  target.addEventListener(eventType, listener, true);
  return listener;
};

export const addEventBubbleListenerWithPassiveFlag = (
  target,
  eventType,
  listener,
  passive
) => {
  target.addEventListener(eventType, listener, {
    passive,
  });
  return listener;
};

export const addEventBubbleListener = (target, eventType, listener) => {
  target.addEventListener(eventType, listener, false);
  return listener;
};

export const removeEventListener = (target, eventType, listener, capture) => {
  target.removeEventListener(eventType, listener, capture);
};
