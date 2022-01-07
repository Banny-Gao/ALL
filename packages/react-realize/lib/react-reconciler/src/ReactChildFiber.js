import {
  createWorkInProgress,
  createFiberFromFragment,
  createFiberFromElement,
  createFiberFromText,
} from './ReactFiber';
import {
  getIteratorFn,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
} from '../../ReactSymbols';
import { Placement, Deletion } from './ReactFiberFlags';
import {
  ClassComponent,
  HostText,
  Fragment,
} from './ReactWorkTags';

const invariant = require('invariant');

const cloneChildFibers = (current, workInProgress) => {
  invariant(
    current === null || workInProgress.child === current.child,
    'Resuming work not yet implemented.'
  );

  if (workInProgress.child === null) return;

  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;

  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps
    );
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
};

const ChildReconciler = (shouldTrackSideEffects) => {
  const placeSingleChild = (newFiber) => {
    if (shouldTrackSideEffects && newFiber.alternate === null)
      newFiber.flags = Placement;

    return newFiber;
  };

  const deleteChild = (returnFiber, childToDelete) => {
    if (!shouldTrackSideEffects) return;

    const last = returnFiber.lastEffect;
    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.flags = Deletion;
  };

  const deleteRemainingChildren = (returnFiber, currentFirstChild) => {
    if (!shouldTrackSideEffects) return null;

    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  };

  const useFiber = (fiber, pendingProps) => {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  };

  const coerceRef = (returnFiber, current, element) => {
    const mixedRef = element.ref;
    if (
      mixedRef !== null &&
      typeof mixedRef !== 'function' &&
      typeof mixedRef !== 'object'
    ) {
      if (element._owner) {
        const owner = element._owner;
        let inst;
        if (owner) {
          const ownerFiber = owner;
          invariant(
            ownerFiber.tag === ClassComponent,
            'Function components cannot have string refs. ' +
              'We recommend using useRef() instead. ' +
              'Learn more about using refs safely here: ' +
              'https://reactjs.org/link/strict-mode-string-ref'
          );
          inst = ownerFiber.stateNode;
        }
        invariant(
          inst,
          'Missing owner for string ref %s. This error is likely caused by a ' +
            'bug in React. Please file an issue.',
          mixedRef
        );
        const stringRef = '' + mixedRef;

        if (
          current !== null &&
          current.ref !== null &&
          typeof current.ref === 'function' &&
          current.ref._stringRef === stringRef
        ) {
          return current.ref;
        }
        const ref = function (value) {
          let refs = inst.refs;
          if (refs === emptyRefsObject) {
            refs = inst.refs = {};
          }
          if (value === null) {
            delete refs[stringRef];
          } else {
            refs[stringRef] = value;
          }
        };
        ref._stringRef = stringRef;
        return ref;
      } else {
        invariant(
          typeof mixedRef === 'string',
          'Expected ref to be a function, a string, an object returned by React.createRef(), or null.'
        );
        invariant(
          element._owner,
          'Element ref was specified as a string (%s) but no owner was set. This could happen for one of' +
            ' the following reasons:\n' +
            '1. You may be adding a ref to a function component\n' +
            "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
            '3. You have multiple copies of React loaded\n' +
            'See https://reactjs.org/link/refs-must-have-owner for more information.',
          mixedRef
        );
      }
    }
    return mixedRef;
  };

  const reconcileSingleElement = (
    returnFiber,
    currentFirstChild,
    element,
    lanes
  ) => {
    const key = element.key;
    let child = currentFirstChild;

    while (child !== null) {
      if (child.key === key) {
        switch (child.tag) {
          case Fragment: {
            if (element.type === REACT_FRAGMENT_TYPE) {
              deleteRemainingChildren(returnFiber, child.sibling);
              const existing = useFiber(child, element.props.children);
              existing.return = returnFiber;

              return existing;
            }
            break;
          }
          default: {
            if (child.elementType === element.type) {
              deleteRemainingChildren(returnFiber, child.sibling);
              const existing = useFiber(child, element.props);
              existing.ref = coerceRef(returnFiber, child, element);
              existing.return = returnFiber;

              return existing;
            }
            break;
          }
        }

        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    if (element.type === REACT_FRAGMENT_TYPE) {
      const created = createFiberFromFragment(
        element.props.children,
        returnFiber.mode,
        lanes,
        element.key
      );
      created.return = returnFiber;
      return created;
    } else {
      const created = createFiberFromElement(element, returnFiber.mode, lanes);
      created.ref = coerceRef(returnFiber, currentFirstChild, element);
      created.return = returnFiber;
      return created;
    }
  };

  const reconcileSingleTextNode = (
    returnFiber,
    currentFirstChild,
    textContent,
    lanes
  ) => {
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      const existing = useFiber(currentFirstChild, textContent);
      existing.return = returnFiber;
      return existing;
    }

    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiberFromText(textContent, returnFiber.mode, lanes);
    created.return = returnFiber;
    return created;
  };

  const updateTextNode = (returnFiber, current, textContent, lanes) => {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent, returnFiber.mode, lanes);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  };

  const updateFragment = (returnFiber, current, fragment, lanes, key) => {
    if (current === null || current.tag !== Fragment) {
      const created = createFiberFromFragment(
        fragment,
        returnFiber.mode,
        lanes,
        key
      );
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, fragment);
      existing.return = returnFiber;
      return existing;
    }
  };

  const updateSlot = (returnFiber, oldFiber, newChild, lanes) => {
    const key = oldFiber !== null ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      if (key !== null) {
        return null;
      }
      return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === key) {
            if (newChild.type === REACT_FRAGMENT_TYPE) {
              return updateFragment(
                returnFiber,
                oldFiber,
                newChild.props.children,
                lanes,
                key
              );
            }
            return updateElement(returnFiber, oldFiber, newChild, lanes);
          } else {
            return null;
          }
        }
        case REACT_LAZY_TYPE: {
          const payload = newChild._payload;
          const init = newChild._init;
          return updateSlot(returnFiber, oldFiber, init(payload), lanes);
        }
      }

      if (Array.isArray(newChild) || getIteratorFn(newChild)) {
        if (key !== null) return null;

        return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
      }
    }

    return null;
  };

  const placeChild = (newFiber, lastPlacedIndex, newIndex) => {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) return lastPlacedIndex;

    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags = Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      newFiber.flags = Placement;
      return lastPlacedIndex;
    }
  };

  const createChild = (returnFiber, newChild, lanes) => {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      const created = createFiberFromText(
        '' + newChild,
        returnFiber.mode,
        lanes
      );
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(
            newChild,
            returnFiber.mode,
            lanes
          );
          created.ref = coerceRef(returnFiber, null, newChild);
          created.return = returnFiber;
          return created;
        }
        case REACT_LAZY_TYPE: {
          const payload = newChild._payload;
          const init = newChild._init;
          return createChild(returnFiber, init(payload), lanes);
        }
      }

      if (Array.isArray(newChild) || getIteratorFn(newChild)) {
        const created = createFiberFromFragment(
          newChild,
          returnFiber.mode,
          lanes,
          null
        );
        created.return = returnFiber;
        return created;
      }
    }

    return null;
  };

  const mapRemainingChildren = (returnFiber, currentFirstChild) => {
    const existingChildren = new Map();

    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  };

  const reconcileChildrenArray = (
    returnFiber,
    currentFirstChild,
    newChildren,
    lanes
  ) => {
    let resultingFirstChild = null;
    let previousNewFiber = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes
      );
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
    }

    return resultingFirstChild;
  };

  const updateElement = (returnFiber, current, element, lanes) => {
    if (current !== null) {
      if (current.elementType === element.type) {
        const existing = useFiber(current, element.props);
        existing.ref = coerceRef(returnFiber, current, element);
        existing.return = returnFiber;

        return existing;
      }
    }

    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    created.ref = coerceRef(returnFiber, current, element);
    created.return = returnFiber;
    return created;
  };

  const updateFromMap = (
    existingChildren,
    returnFiber,
    newIdx,
    newChild,
    lanes
  ) => {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild, lanes);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;
          if (newChild.type === REACT_FRAGMENT_TYPE) {
            return updateFragment(
              returnFiber,
              matchedFiber,
              newChild.props.children,
              lanes,
              newChild.key
            );
          }
          return updateElement(returnFiber, matchedFiber, newChild, lanes);
        }
        case REACT_LAZY_TYPE: {
          const payload = newChild._payload;
          const init = newChild._init;
          return updateFromMap(
            existingChildren,
            returnFiber,
            newIdx,
            init(payload),
            lanes
          );
        }
      }

      if (Array.isArray(newChild) || getIteratorFn(newChild)) {
        const matchedFiber = existingChildren.get(newIdx) || null;
        return updateFragment(returnFiber, matchedFiber, newChild, lanes, null);
      }
    }

    return null;
  };

  const reconcileChildrenIterator = (
    returnFiber,
    currentFirstChild,
    newChildrenIterable,
    lanes
  ) => {
    const iteratorFn = getIteratorFn(newChildrenIterable);
    invariant(
      typeof iteratorFn === 'function',
      'An object is not an iterable. This error is likely caused by a bug in ' +
        'React. Please file an issue.'
    );

    const newChildren = iteratorFn.call(newChildrenIterable);
    invariant(newChildren != null, 'An iterable object provided no iterator.');

    let resultingFirstChild = null;
    let previousNewFiber = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;

    let step = newChildren.next();
    for (
      ;
      oldFiber !== null && !step.done;
      newIdx++, step = newChildren.next()
    ) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
      if (newFiber === null) {
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (step.done) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; !step.done; newIdx++, step = newChildren.next()) {
        const newFiber = createChild(returnFiber, step.value, lanes);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; !step.done; newIdx++, step = newChildren.next()) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        step.value,
        lanes
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
    }

    return resultingFirstChild;
  };

  const reconcileChildFibers = (
    returnFiber,
    currentFirstChild,
    newChild,
    lanes
  ) => {
    const isUnkeyedTopLevelFragment =
      typeof newChild === 'object' &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null;

    if (isUnkeyedTopLevelFragment) newChild = newChild.props.children;

    const isObject = typeof newChild === 'object' && newChild !== null;
    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes
            )
          );
        case REACT_LAZY_TYPE: {
          const payload = newChild._payload;
          const init = newChild._init;

          return reconcileChildFibers(
            returnFiber,
            currentFirstChild,
            init(payload),
            lanes
          );
        }
      }
    }

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(
          returnFiber,
          currentFirstChild,
          '' + newChild,
          lanes
        )
      );
    }

    if (Array.isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
    }

    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes
      );
    }

    return deleteRemainingChildren(returnFiber, currentFirstChild);
  };

  return reconcileChildFibers;
};

const reconcileChildFibers = ChildReconciler(true);
const mountChildFibers = ChildReconciler(false);

export { cloneChildFibers, reconcileChildFibers, mountChildFibers };
