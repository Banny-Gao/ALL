import { Namespaces, getIntrinsicNamespace } from '../../../DOMNamespaces';
import { DOCUMENT_NODE } from '../../../HTMLNodeType';
import { isCustomComponent } from '../shared/isCustomComponent';

import { listenToNonDelegatedEvent } from '../events/DOMPluginEventSystem';

import {
  initWrapperState as ReactDOMInputInitWrapperState,
  getHostProps as ReactDOMInputGetHostProps,
  postMountWrapper as ReactDOMInputPostMountWrapper,
} from './ReactDOMInput';
import {
  getHostProps as ReactDOMOptionGetHostProps,
  postMountWrapper as ReactDOMOptionPostMountWrapper,
} from './ReactDOMOption';
import {
  initWrapperState as ReactDOMSelectInitWrapperState,
  getHostProps as ReactDOMSelectGetHostProps,
  postMountWrapper as ReactDOMSelectPostMountWrapper,
} from './ReactDOMSelect';
import {
  initWrapperState as ReactDOMTextareaInitWrapperState,
  getHostProps as ReactDOMTextareaGetHostProps,
  postMountWrapper as ReactDOMTextareaPostMountWrapper,
} from './ReactDOMTextarea';
import { setValueForStyles } from '../shared/CSSPropertyOperations';
import { setInnerHTML } from './setInnerHTML';
import { setTextContent } from './setTextContent';
import { registrationNameDependencies } from '../events/EventRegistry';
import { setValueForProperty } from './DOMPropertyOperations';
import { track } from './inputValueTracking';

const DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
const SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
const AUTOFOCUS = 'autoFocus';
const CHILDREN = 'children';
const STYLE = 'style';
const HTML = '__html';

const { html: HTML_NAMESPACE } = Namespaces;

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

const diffProperties = (
  domElement,
  tag,
  lastRawProps,
  nextRawProps,
  rootContainerElement
) => {};

const diffHydratedProperties = (
  domElement,
  tag,
  rawProps,
  parentNamespace,
  rootContainerElement
) => {};

const getOwnerDocumentFromRootContainer = (rootContainerElement) =>
  rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : rootContainerElement.ownerDocument;

const createElement = (type, props, rootContainerElement, parentNamespace) => {
  const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);

  let domElement;
  let namespaceURI = parentNamespace;
  if (namespaceURI === HTML_NAMESPACE) {
    namespaceURI = getIntrinsicNamespace(type);
  }
  if (namespaceURI === HTML_NAMESPACE) {
    if (type === 'script') {
      const div = ownerDocument.createElement('div');
      div.innerHTML = '<script><' + '/script>';

      const firstChild = div.firstChild;
      domElement = div.removeChild(firstChild);
    } else if (typeof props.is === 'string') {
      domElement = ownerDocument.createElement(type, { is: props.is });
    } else {
      domElement = ownerDocument.createElement(type);

      if (type === 'select') {
        const node = domElement;
        if (props.multiple) {
          node.multiple = true;
        } else if (props.size) {
          node.size = props.size;
        }
      }
    }
  } else {
    domElement = ownerDocument.createElementNS(namespaceURI, type);
  }

  return domElement;
};

const setInitialDOMProperties = (
  tag,
  domElement,
  rootContainerElement,
  nextProps,
  isCustomComponentTag
) => {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];
    if (propKey === STYLE) {
      setValueForStyles(domElement, nextProp);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      const nextHtml = nextProp ? nextProp[HTML] : undefined;
      if (nextHtml != null) {
        setInnerHTML(domElement, nextHtml);
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string') {
        const canSetTextContent = tag !== 'textarea' || nextProp !== '';
        if (canSetTextContent) {
          setTextContent(domElement, nextProp);
        }
      } else if (typeof nextProp === 'number') {
        setTextContent(domElement, '' + nextProp);
      }
    } else if (
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } else if (propKey === AUTOFOCUS) {
      // We polyfill it separately on the client during commit.
      // We could have excluded it in the property list instead of
      // adding a special case here, but then it wouldn't be emitted
      // on server rendering (but we *do* want to emit it in SSR).
    } else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (nextProp != null) {
        if (propKey === 'onScroll') {
          listenToNonDelegatedEvent('scroll', domElement);
        }
      }
    } else if (nextProp != null) {
      setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
    }
  }
};

const trapClickOnNonInteractiveElement = (node) => {
  node.onclick = () => {};
};

const setInitialProperties = (
  domElement,
  tag,
  rawProps,
  rootContainerElement
) => {
  const isCustomComponentTag = isCustomComponent(tag, rawProps);
  let props;

  switch (tag) {
    case 'dialog':
      listenToNonDelegatedEvent('cancel', domElement);
      listenToNonDelegatedEvent('close', domElement);
      props = rawProps;
      break;
    case 'iframe':
    case 'object':
    case 'embed':
      listenToNonDelegatedEvent('load', domElement);
      props = rawProps;
      break;
    case 'video':
    case 'audio':
      for (let i = 0; i < mediaEventTypes.length; i++) {
        listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
      }
      props = rawProps;
      break;
    case 'source':
      listenToNonDelegatedEvent('error', domElement);
      props = rawProps;
      break;
    case 'img':
    case 'image':
    case 'link':
      listenToNonDelegatedEvent('error', domElement);
      listenToNonDelegatedEvent('load', domElement);
      props = rawProps;
      break;
    case 'details':
      listenToNonDelegatedEvent('toggle', domElement);
      props = rawProps;
      break;
    case 'input':
      ReactDOMInputInitWrapperState(domElement, rawProps);
      props = ReactDOMInputGetHostProps(domElement, rawProps);

      listenToNonDelegatedEvent('invalid', domElement);
      break;
    case 'option':
      props = ReactDOMOptionGetHostProps(domElement, rawProps);
      break;
    case 'select':
      ReactDOMSelectInitWrapperState(domElement, rawProps);
      props = ReactDOMSelectGetHostProps(domElement, rawProps);

      listenToNonDelegatedEvent('invalid', domElement);
      break;
    case 'textarea':
      ReactDOMTextareaInitWrapperState(domElement, rawProps);
      props = ReactDOMTextareaGetHostProps(domElement, rawProps);

      listenToNonDelegatedEvent('invalid', domElement);
      break;
    default:
      props = rawProps;
  }

  setInitialDOMProperties(
    tag,
    domElement,
    rootContainerElement,
    props,
    isCustomComponentTag
  );

  switch (tag) {
    case 'input':
      track(domElement);
      ReactDOMInputPostMountWrapper(domElement, rawProps, false);
      break;
    case 'textarea':
      track(domElement);
      ReactDOMTextareaPostMountWrapper(domElement, rawProps);
      break;
    case 'option':
      ReactDOMOptionPostMountWrapper(domElement, rawProps);
      break;
    case 'select':
      ReactDOMSelectPostMountWrapper(domElement, rawProps);
      break;
    default:
      if (typeof props.onClick === 'function') {
        trapClickOnNonInteractiveElement(domElement);
      }
      break;
  }
};

export {
  diffProperties,
  diffHydratedProperties,
  createElement,
  setInitialProperties,
  mediaEventTypes,
  trapClickOnNonInteractiveElement,
};
