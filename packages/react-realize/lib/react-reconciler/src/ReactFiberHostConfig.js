import { getChildNamespace } from '../../DOMNamespaces';

import {
  TEXT_NODE,
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../../HTMLNodeType';

import {
  diffProperties,
  diffHydratedProperties,
  createElement,
  setInitialProperties,
  trapClickOnNonInteractiveElement,
  updateProperties,
} from '../../react-dom/src/client/ReactDOMComponent';
import {
  precacheFiberNode,
  updateFiberProps,
} from '../../react-dom/src/client/ReactDOMComponentTree';
import {
  isEnabled,
  setEnabled,
} from '../../react-dom/src/events/ReactDOMEventListener';
import {
  getSelectionInformation,
  restoreSelection,
} from '../../react-dom/src/client/ReactInputSelection';
import { setTextContent } from '../../react-dom/src/client/setTextContent';
import { retryIfBlockedOn } from '../../react-dom/src/events/ReactDOMEventReplaying';

const noTimeout = -1;

let eventsEnabled = null;
let selectionInformation = null;

const clearContainer = (container) => {
  container.children.splice(0);
};

const getRootHostContext = (rootContainerInstance) => {
  let type;
  let namespace;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = rootContainerInstance.documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
      break;
    }
    default: {
      const container =
        nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
      break;
    }
  }

  return namespace;
};

const getNextHydratable = (node) => {
  for (; node != null; node = node.nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
  }
  return node;
};

const getFirstHydratableChild = (parentInstance) =>
  getNextHydratable(parentInstance.firstChild);

const shouldSetTextContent = (type, props) => {
  return (
    type === 'textarea' ||
    type === 'option' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
};

const getNextHydratableSibling = (instance) => {
  return getNextHydratable(instance.nextSibling);
};

const getNextHydratableInstanceAfterSuspenseInstance = (suspenseInstance) => {
  let node = suspenseInstance.nextSibling;

  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = node.data;
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling(node);
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        depth++;
      }
    }
    node = node.nextSibling;
  }

  return null;
};

const canHydrateInstance = (instance, type, props) => {
  if (
    instance.nodeType !== ELEMENT_NODE ||
    type.toLowerCase() !== instance.nodeName.toLowerCase()
  ) {
    return null;
  }

  return instance;
};

const prepareUpdate = (
  domElement,
  type,
  oldProps,
  newProps,
  rootContainerInstance,
  hostContext
) =>
  diffProperties(domElement, type, oldProps, newProps, rootContainerInstance);

const hydrateInstance = (
  instance,
  type,
  props,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) => {
  precacheFiberNode(internalInstanceHandle, instance);

  updateFiberProps(instance, props);

  return diffHydratedProperties(
    instance,
    type,
    props,
    hostContext,
    rootContainerInstance
  );
};

const createInstance = (
  type,
  props,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) => {
  const domElement = createElement(
    type,
    props,
    rootContainerInstance,
    hostContext
  );
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
};

const appendInitialChild = (parentInstance, child) => {
  parentInstance.appendChild(child);
};

const shouldAutoFocusHostComponent = (type, props) => {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
};

const finalizeInitialChildren = (
  domElement,
  type,
  props,
  rootContainerInstance,
  hostContext
) => {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  return shouldAutoFocusHostComponent(type, props);
};

const prepareForCommit = (containerInfo) => {
  eventsEnabled = isEnabled();
  selectionInformation = getSelectionInformation();

  setEnabled(false);
  return null;
};

const resetTextContent = (domElement) => {
  setTextContent(domElement, '');
};

const insertInContainerBefore = (container, child, beforeChild) => {
  if (container.nodeType === COMMENT_NODE) {
    container.parentNode.insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
};

const appendChildToContainer = (container, child) => {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = container.parentNode;
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }

  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    trapClickOnNonInteractiveElement(parentNode);
  }
};

const commitUpdate = (
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps,
  internalInstanceHandle
) => {
  updateFiberProps(domElement, newProps);
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
};

const commitTextUpdate = (textInstance, oldText, newText) => {
  textInstance.nodeValue = newText;
};

const commitHydratedContainer = (container) => {
  retryIfBlockedOn(container);
};

const resetAfterCommit = (containerInfo) => {
  restoreSelection(selectionInformation);
  setEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
};

export {
  noTimeout,
  clearContainer,
  getRootHostContext,
  getNextHydratable,
  getFirstHydratableChild,
  shouldSetTextContent,
  getNextHydratableSibling,
  getNextHydratableInstanceAfterSuspenseInstance,
  canHydrateInstance,
  prepareUpdate,
  hydrateInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareForCommit,
  resetTextContent,
  insertInContainerBefore,
  appendChildToContainer,
  commitUpdate,
  commitTextUpdate,
  commitHydratedContainer,
  resetAfterCommit,
};
