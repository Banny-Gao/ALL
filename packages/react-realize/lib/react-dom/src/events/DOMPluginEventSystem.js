import { DOCUMENT_NODE } from '../../../HTMLNodeType';
import { IS_NON_DELEGATED, IS_CAPTURE_PHASE } from './EventSystemFlags';

import { getEventListenerSet } from '../client/ReactDOMComponentTree';
import { allNativeEvents } from './EventRegistry';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import {
  addEventCaptureListener,
  addEventBubbleListener,
  addEventBubbleListenerWithPassiveFlag,
  addEventCaptureListenerWithPassiveFlag,
} from './EventListener';

const listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);

const mediaEventTypes = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
];

const nonDelegatedEvents = new Set([
  'cancel',
  'close',
  'invalid',
  'load',
  'scroll',
  'toggle',
  ...mediaEventTypes,
]);

const getListenerSetKey = (domEventName, capture) =>
  `${domEventName}__${capture ? 'capture' : 'bubble'}`;

const addTrappedEventListener = (
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) => {
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );
  let isPassiveListener;

  if (
    domEventName === 'touchstart' ||
    domEventName === 'touchmove' ||
    domEventName === 'wheel'
  ) {
    isPassiveListener = true;
  }

  if (isCapturePhaseListener) {
    if (isPassiveListener !== undefined) {
      addEventCaptureListenerWithPassiveFlag(
        targetContainer,
        domEventName,
        listener,
        isPassiveListener
      );
    } else {
      addEventCaptureListener(targetContainer, domEventName, listener);
    }
  } else {
    if (isPassiveListener !== undefined) {
      addEventBubbleListenerWithPassiveFlag(
        targetContainer,
        domEventName,
        listener,
        isPassiveListener
      );
    } else {
      unsubscribeListener = addEventBubbleListener(
        targetContainer,
        domEventName,
        listener
      );
    }
  }
};

const listenToNativeEvent = (
  domEventName,
  isCapturePhaseListener,
  rootContainerElement,
  targetElement,
  eventSystemFlags = 0
) => {
  let target = rootContainerElement;

  if (
    domEventName === 'selectionchange' &&
    rootContainerElement.nodeType !== DOCUMENT_NODE
  ) {
    target = rootContainerElement.ownerDocument;
  }

  if (
    targetElement !== null &&
    !isCapturePhaseListener &&
    nonDelegatedEvents.has(domEventName)
  ) {
    if (domEventName !== 'scroll') {
      return;
    }
    eventSystemFlags |= IS_NON_DELEGATED;
    target = targetElement;
  }

  const listenerSet = getEventListenerSet(target);
  const listenerSetKey = getListenerSetKey(
    domEventName,
    isCapturePhaseListener
  );

  if (!listenerSet.has(listenerSetKey)) {
    if (isCapturePhaseListener) {
      eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(
      target,
      domEventName,
      eventSystemFlags,
      isCapturePhaseListener
    );
    listenerSet.add(listenerSetKey);
  }
};

const listenToAllSupportedEvents = (rootContainerElement) => {
  if (rootContainerElement[listeningMarker]) return;

  rootContainerElement[listeningMarker] = true;

  allNativeEvents.forEach((domEventName) => {
    if (!nonDelegatedEvents.has(domEventName)) {
      listenToNativeEvent(domEventName, false, rootContainerElement, null);
    }

    listenToNativeEvent(domEventName, true, rootContainerElement, null);
  });
};

const listenToNonDelegatedEvent = (domEventName, targetElement) => {
  const isCapturePhaseListener = false;
  const listenerSet = getEventListenerSet(targetElement);
  const listenerSetKey = getListenerSetKey(
    domEventName,
    isCapturePhaseListener
  );
  if (!listenerSet.has(listenerSetKey)) {
    addTrappedEventListener(
      targetElement,
      domEventName,
      IS_NON_DELEGATED,
      isCapturePhaseListener
    );
    listenerSet.add(listenerSetKey);
  }
};

export {
  mediaEventTypes,
  nonDelegatedEvents,
  getListenerSetKey,
  listenToNativeEvent,
  listenToAllSupportedEvents,
  listenToNonDelegatedEvent,
};
