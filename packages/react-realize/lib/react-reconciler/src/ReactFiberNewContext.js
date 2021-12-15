let currentlyRenderingFiber = null;
let lastContextDependency = null;
let lastContextWithAllBitsObserved = null;

export const resetContextDependencies = () => {
  currentlyRenderingFiber = null;
  lastContextDependency = null;
  lastContextWithAllBitsObserved = null;
};
