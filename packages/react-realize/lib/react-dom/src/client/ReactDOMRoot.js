import { LegacyRoot } from '../../../react-reconciler/src/ReactRootTags';
import { createContainer } from '../../../react-reconciler/src/ReactFiberReconciler';

import { markContainerAsRoot } from './ReactDOMComponentTree';

const createRootImpl = (container, tag, options) => {
  const hydrate = options?.hydrate;

  const root = createContainer(container, tag, hydrate);

  markContainerAsRoot(root.current, container);

  return root;
};

class ReactDOMBlockingRoot {
  constructor(container, tag, options) {
    this._internalRoot = createRootImpl(container, tag, options);
  }
}

export const createLegacyRoot = (container, options) =>
  new ReactDOMBlockingRoot(container, LegacyRoot, options);
