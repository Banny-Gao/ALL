import {
  TEXT_NODE,
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../../HTMLNodeType';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const Namespaces = {
  html: HTML_NAMESPACE,
  mathml: MATH_NAMESPACE,
  svg: SVG_NAMESPACE,
};

export const noTimeout = -1;

export const clearContainer = (container) => {
  container.children.splice(0);
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
