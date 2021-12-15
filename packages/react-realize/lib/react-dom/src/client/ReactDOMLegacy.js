import { DOCUMENT_NODE, ELEMENT_NODE } from '../../../HTMLNodeType';
import { ROOT_ATTRIBUTE_NAME } from '../../../DOMProperty';
import { createLegacyRoot } from './ReactDOMRoot';

import {
  getPublicRootInstance,
  unbatchedUpdates,
  updateContainer,
} from '../../../react-reconciler/src/ReactFiberReconciler';

const getReactRootElementInContainer = (container) => {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
};

const shouldHydrateDueToLegacyHeuristic = (container) => {
  const rootElement = getReactRootElementInContainer(container);
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  );
};

const legacyCreateRootFromDOMContainer = (container, forceHydrate) => {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);

  if (!shouldHydrate) {
    let rootSibling;
    while ((rootSibling = container.lastChild))
      container.removeChild(rootSibling);
  }

  return createLegacyRoot(
    container,
    shouldHydrate
      ? {
          hydrate: true,
        }
      : undefined
  );
};

const legacyRenderSubtreeIntoContainer = (
  parentComponent,
  children,
  container,
  forceHydrate,
  callback
) => {
  let root = container._reactRootContainer;
  let fiberRoot = null;
  let runner;

  if (!root) {
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate
    );

    runner = (callback) =>
      unbatchedUpdates(() => {
        updateContainer(children, fiberRoot, parentComponent, callback);
      });
  } else {
    runner = (callback) =>
      updateContainer(children, fiberRoot, parentComponent, callback);
  }

  fiberRoot = root._internalRoot;

  const originalCallback = callback;
  callback = () => {
    const instance = getPublicRootInstance(fiberRoot);
    originalCallback.callback(instance);
  };

  runner(originalCallback);

  return getPublicRootInstance(fiberRoot);
};

export const render = (element, container, callback) =>
  legacyRenderSubtreeIntoContainer(null, element, container, false, callback);

export const hydrate = (element, container, callback) =>
  legacyRenderSubtreeIntoContainer(null, element, container, true, callback);
