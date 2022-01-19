import { get as getInstance } from '../../ReactInstanceMap';
import { Placement, Hydrating, NoFlags } from './ReactFiberFlags';
import { HostRoot } from './ReactWorkTags';

const doesFiberContain = (parentFiber, childFiber) => {
  let node = childFiber;
  const parentFiberAlternate = parentFiber.alternate;
  while (node !== null) {
    if (node === parentFiber || node === parentFiberAlternate) {
      return true;
    }
    node = node.return;
  }
  return false;
};

const getNearestMountedFiber = (fiber) => {
  let node = fiber;
  let nearestMounted = fiber;
  if (!fiber.alternate) {
    let nextNode = node;
    do {
      node = nextNode;
      if ((node.flags & (Placement | Hydrating)) !== NoFlags) {
        nearestMounted = node.return;
      }
      nextNode = node.return;
    } while (nextNode);
  } else {
    while (node.return) {
      node = node.return;
    }
  }

  if (node.tag === HostRoot) return nearestMounted;

  return null;
};

const isMounted = (component) => {
  const fiber = getInstance(component);
  if (!fiber) return false;

  return getNearestMountedFiber(fiber) === fiber;
};

export { doesFiberContain, isMounted, getNearestMountedFiber };
