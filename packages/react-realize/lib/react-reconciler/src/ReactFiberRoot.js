import {
  NoLanePriority,
  createLaneMap,
  NoLanes,
  NoTimestamp,
} from './ReactFiberLane';
import { createHostRootFiber } from './ReactFiber';
import { initializeUpdateQueue } from './ReactUpdateQueue';

class FiberRootNode {
  constructor(containerInfo, tag, hydrate) {
    Object.assign(this, {
      containerInfo,
      tag,
      hydrate,
      pendingChildren: null,
      current: null,
      pingCache: null,
      finishedWork: null,
      timeoutHandle: () => {},
      context: null,
      pendingContext: null,
      callbackNode: null,
      callbackPriority: NoLanePriority,
      eventTimes: createLaneMap(NoLanes),
      expirationTimes: createLaneMap(NoTimestamp),

      pendingLanes: NoLanes,
      suspendedLanes: NoLanes,
      pingedLanes: NoLanes,
      expiredLanes: NoLanes,
      mutableReadLanes: NoLanes,
      finishedLanes: NoLanes,

      entangledLanes: NoLanes,
      entanglements: createLaneMap(NoLanes),
    });
  }
}

export const createFiberRoot = (containerInfo, tag, hydrate) => {
  const root = new FiberRootNode(containerInfo, tag, hydrate);

  const uninitializedFiber = createHostRootFiber(tag);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  initializeUpdateQueue(uninitializedFiber);

  return root;
};
