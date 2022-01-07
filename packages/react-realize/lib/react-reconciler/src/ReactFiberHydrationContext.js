import { getFirstHydratableChild } from './ReactFiberHostConfig';

let hydrationParentFiber = null;
let nextHydratableInstance = null;
let isHydrating = false;

const resetHydrationState = () => {
  hydrationParentFiber = null;
  nextHydratableInstance = null;
  isHydrating = false;
};

const enterHydrationState = (fiber) => {
  const parentInstance = fiber.stateNode.containerInfo;
  nextHydratableInstance = getFirstHydratableChild(parentInstance);
  hydrationParentFiber = fiber;
  isHydrating = true;
  return true;
};

export { resetHydrationState, enterHydrationState };
