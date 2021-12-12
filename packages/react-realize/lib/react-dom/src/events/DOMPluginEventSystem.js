import { DOCUMENT_NODE } from '../../../HTMLNodeType';
import { IS_NON_DELEGATED } from './EventSystemFlags';

import { getEventListenerSet } from '../client/ReactDOMComponentTree';

const listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);

export const mediaEventTypes = [
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

export const nonDelegatedEvents = new Set([
  'cancel',
  'close',
  'invalid',
  'load',
  'scroll',
  'toggle',
  ...mediaEventTypes,
]);

export const getListenerSetKey = (domEventName, capture) =>
  `${domEventName}__${capture ? 'capture' : 'bubble'}`;

const addTrappedEventListener = (
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener,
  isDeferredListenerForLegacyFBSupport
) => {};

export const listenToNativeEvent = (
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

export const listenToAllSupportedEvents = (rootContainerElement) => {
  if (rootContainerElement[listeningMarker]) return;

  rootContainerElement[listeningMarker] = true;

  allNativeEvents.forEach((domEventName) => {
    if (!nonDelegatedEvents.has(domEventName)) {
      listenToNativeEvent(domEventName, false, rootContainerElement, null);
    }
  });
};
