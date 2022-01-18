import { TEXT_NODE } from '../../../HTMLNodeType';

const getLeafNode = (node) => {
  while (node && node.firstChild) {
    node = node.firstChild;
  }
  return node;
};

const getSiblingNode = (node) => {
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    node = node.parentNode;
  }
};

const getNodeForCharacterOffset = (root, offset) => {
  let node = getLeafNode(root);
  let nodeStart = 0;
  let nodeEnd = 0;

  while (node) {
    if (node.nodeType === TEXT_NODE) {
      nodeEnd = nodeStart + node.textContent.length;

      if (nodeStart <= offset && nodeEnd >= offset) {
        return {
          node: node,
          offset: offset - nodeStart,
        };
      }

      nodeStart = nodeEnd;
    }

    node = getLeafNode(getSiblingNode(node));
  }
};

export { getNodeForCharacterOffset };
