import { TEXT_NODE } from '../../../HTMLNodeType';

const getModernOffsetsFromPoints = (
  outerNode,
  anchorNode,
  anchorOffset,
  focusNode,
  focusOffset
) => {
  let length = 0;
  let start = -1;
  let end = -1;
  let indexWithinAnchor = 0;
  let indexWithinFocus = 0;
  let node = outerNode;
  let parentNode = null;

  while (true) {
    let next = null;

    while (true) {
      if (
        node === anchorNode &&
        (anchorOffset === 0 || node.nodeType === TEXT_NODE)
      ) {
        start = length + anchorOffset;
      }
      if (
        node === focusNode &&
        (focusOffset === 0 || node.nodeType === TEXT_NODE)
      ) {
        end = length + focusOffset;
      }

      if (node.nodeType === TEXT_NODE) {
        length += node.nodeValue.length;
      }

      if ((next = node.firstChild) === null) {
        break;
      }

      parentNode = node;
      node = next;
    }

    while (true) {
      if (node === outerNode) {
        if (start === -1 || end === -1) {
          return null;
        }

        return {
          start: start,
          end: end,
        };
      }
      if (parentNode === anchorNode && ++indexWithinAnchor === anchorOffset) {
        start = length;
      }
      if (parentNode === focusNode && ++indexWithinFocus === focusOffset) {
        end = length;
      }
      if ((next = node.nextSibling) !== null) {
        break;
      }
      node = parentNode;
      parentNode = node.parentNode;
    }

    node = next;
  }
};

const getOffsets = (outerNode) => {
  const { ownerDocument } = outerNode;
  const win = (ownerDocument && ownerDocument.defaultView) || window;
  const selection = win.getSelection && win.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

  try {
    anchorNode.nodeType;
    focusNode.nodeType;
  } catch (e) {
    return null;
  }

  return getModernOffsetsFromPoints(
    outerNode,
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset
  );
};

export { getOffsets, getModernOffsetsFromPoints };
