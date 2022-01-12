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
} from '../../react-dom/src/client/ReactDOMComponent';
import {
  precacheFiberNode,
  updateFiberProps,
} from '../../react-dom/src/client/ReactDOMComponentTree';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';

export const Namespaces = {
  html: HTML_NAMESPACE,
  mathml: MATH_NAMESPACE,
  svg: SVG_NAMESPACE,
};

export const noTimeout = -1;

export const clearContainer = (container) => {
  container.children.splice(0);
};

export const getIntrinsicNamespace = (type) => {
  switch (type) {
    case 'svg':
      return SVG_NAMESPACE;
    case 'math':
      return MATH_NAMESPACE;
    default:
      return HTML_NAMESPACE;
  }
};

export const getChildNamespace = (parentNamespace, type) => {
  if (parentNamespace == null || parentNamespace === HTML_NAMESPACE) {
    return getIntrinsicNamespace(type);
  }
  if (parentNamespace === SVG_NAMESPACE && type === 'foreignObject') {
    return HTML_NAMESPACE;
  }
  return parentNamespace;
};

export const getRootHostContext = (rootContainerInstance) => {
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

export const getNextHydratable = (node) => {
  for (; node != null; node = node.nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
  }
  return node;
};

export const getFirstHydratableChild = (parentInstance) =>
  getNextHydratable(parentInstance.firstChild);

export const shouldSetTextContent = (type, props) => {
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

export const getNextHydratableSibling = (instance) => {
  return getNextHydratable(instance.nextSibling);
};

export const getNextHydratableInstanceAfterSuspenseInstance = (
  suspenseInstance
) => {
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

export const canHydrateInstance = (instance, type, props) => {
  if (
    instance.nodeType !== ELEMENT_NODE ||
    type.toLowerCase() !== instance.nodeName.toLowerCase()
  ) {
    return null;
  }

  return instance;
};

export const prepareUpdate = (
  domElement,
  type,
  oldProps,
  newProps,
  rootContainerInstance,
  hostContext
) =>
  diffProperties(domElement, type, oldProps, newProps, rootContainerInstance);

export const hydrateInstance = (
  instance,
  type,
  props,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) => {
  precacheFiberNode(internalInstanceHandle, instance);

  updateFiberProps(instance, props);
  const parentNamespace = hostContext;

  return diffHydratedProperties(
    instance,
    type,
    props,
    parentNamespace,
    rootContainerInstance
  );
};
