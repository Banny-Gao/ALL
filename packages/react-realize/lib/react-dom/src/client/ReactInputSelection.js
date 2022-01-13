import { getActiveElement } from './getActiveElement';
import { getOffsets } from './ReactDOMSelection';

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

export { getSelectionInformation, hasSelectionCapabilities, getSelection };
