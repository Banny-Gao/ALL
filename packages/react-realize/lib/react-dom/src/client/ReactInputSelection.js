import { TEXT_NODE, ELEMENT_NODE } from '../../../HTMLNodeType';

import { getActiveElement } from './getActiveElement';
import { getOffsets, setOffsets } from './ReactDOMSelection';

const isSameOriginFrame = (iframe) => {
  try {
    return typeof iframe.contentWindow.location.href === 'string';
  } catch (err) {
    return false;
  }
};

const getActiveElementDeep = () => {
  let win = window;
  let element = getActiveElement();
  while (element instanceof win.HTMLIFrameElement) {
    if (isSameOriginFrame(element)) {
      win = element.contentWindow;
    } else {
      return element;
    }
    element = getActiveElement(win.document);
  }
  return element;
};

const hasSelectionCapabilities = (elem) => {
  const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName &&
    ((nodeName === 'input' &&
      (elem.type === 'text' ||
        elem.type === 'search' ||
        elem.type === 'tel' ||
        elem.type === 'url' ||
        elem.type === 'password')) ||
      nodeName === 'textarea' ||
      elem.contentEditable === 'true')
  );
};

const getSelection = (input) => {
  let selection;

  if ('selectionStart' in input) {
    selection = {
      start: input.selectionStart,
      end: input.selectionEnd,
    };
  } else {
    selection = getOffsets(input);
  }

  return selection || { start: 0, end: 0 };
};

const getSelectionInformation = () => {
  const focusedElem = getActiveElementDeep();
  return {
    focusedElem: focusedElem,
    selectionRange: hasSelectionCapabilities(focusedElem)
      ? getSelection(focusedElem)
      : null,
  };
};

const isTextNode = (node) => {
  return node && node.nodeType === TEXT_NODE;
};

const containsNode = (outerNode, innerNode) => {
  if (!outerNode || !innerNode) {
    return false;
  } else if (outerNode === innerNode) {
    return true;
  } else if (isTextNode(outerNode)) {
    return false;
  } else if (isTextNode(innerNode)) {
    return containsNode(outerNode, innerNode.parentNode);
  } else if ('contains' in outerNode) {
    return outerNode.contains(innerNode);
  } else if (outerNode.compareDocumentPosition) {
    return !!(outerNode.compareDocumentPosition(innerNode) & 16);
  } else {
    return false;
  }
};

const isInDocument = (node) => {
  return (
    node &&
    node.ownerDocument &&
    containsNode(node.ownerDocument.documentElement, node)
  );
};

const setSelection = (input, offsets) => {
  const start = offsets.start;
  let end = offsets.end;
  if (end === undefined) {
    end = start;
  }

  if ('selectionStart' in input) {
    input.selectionStart = start;
    input.selectionEnd = Math.min(end, input.value.length);
  } else {
    setOffsets(input, offsets);
  }
};

const restoreSelection = (priorSelectionInformation) => {
  const curFocusedElem = getActiveElementDeep();
  const priorFocusedElem = priorSelectionInformation.focusedElem;
  const priorSelectionRange = priorSelectionInformation.selectionRange;
  if (curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)) {
    if (
      priorSelectionRange !== null &&
      hasSelectionCapabilities(priorFocusedElem)
    ) {
      setSelection(priorFocusedElem, priorSelectionRange);
    }

    const ancestors = [];
    let ancestor = priorFocusedElem;
    while ((ancestor = ancestor.parentNode)) {
      if (ancestor.nodeType === ELEMENT_NODE) {
        ancestors.push({
          element: ancestor,
          left: ancestor.scrollLeft,
          top: ancestor.scrollTop,
        });
      }
    }

    if (typeof priorFocusedElem.focus === 'function') {
      priorFocusedElem.focus();
    }

    for (let i = 0; i < ancestors.length; i++) {
      const info = ancestors[i];
      info.element.scrollLeft = info.left;
      info.element.scrollTop = info.top;
    }
  }
};

export {
  getSelectionInformation,
  hasSelectionCapabilities,
  getSelection,
  restoreSelection,
};
