import { LegacyRoot } from '../../../react-reconciler/src/ReactRootTags';
import { createContainer } from '../../../react-reconciler/src/ReactFiberReconciler';

import { COMMENT_NODE } from '../../../HTMLNodeType';

import { markContainerAsRoot } from './ReactDOMComponentTree';
import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';

const createRootImpl = (container, tag, options) => {
  const hydrate = options?.hydrate;

  const root = createContainer(container, tag, hydrate);

  markContainerAsRoot(root.current, container);

  const containerNodeType = container.nodeType;
  const rootContainerElement =
    containerNodeType === COMMENT_NODE ? container.parentNode : container;

  listenToAllSupportedEvents(rootContainerElement);

  return root;
};

class ReactDOMBlockingRoot {
  constructor(container, tag, options) {
    this._internalRoot = createRootImpl(container, tag, options);
  }
}

export const createLegacyRoot = (container, options) =>
  new ReactDOMBlockingRoot(container, LegacyRoot, options);
