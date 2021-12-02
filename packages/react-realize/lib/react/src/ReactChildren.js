import { isValidElement, cloneAndReplaceKey } from './ReactElement';
import {
  getIteratorFn,
  REACT_ELEMENT_TYPE,
  REACT_PORTAL_TYPE,
} from '../../ReactSymbols';

const SEPARATOR = '.';
const SUBSEPARATOR = ':';

const escape = (key) => {
  const escapeRegex = /[=:]/g;
  const escaperLookup = {
    '=': '=0',
    ':': '=2',
  };

  const escapedString = key.replace(
    escapeRegex,
    (match) => escaperLookup[match]
  );

  return '$' + escapedString;
};

const escapeUserProvidedKey = (text) => text.replace(/\/+/g, '$&/');

const getElementKey = (element, index) => {
  if (
    typeof element === 'object' &&
    element !== null &&
    element.key != null
  )
    return escape('' + element.key);

  return index.toString(36);
};

const mapIntoArray = (
  children,
  array,
  escapedPrefix,
  nameSoFar,
  callback
) => {
  const type = typeof children;

  if (type === 'undefined' || type === 'boolean') children = null;

  let invokeCallback = false;
  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'string':
      case 'number':
        invokeCallback = true;
        break;
      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
        }
    }
  }

  if (invokeCallback) {
    const child = children;
    let mappedChild = callback(child);

    const childKey =
      nameSoFar === ''
        ? SEPARATOR + getElementKey(child, 0)
        : nameSoFar;

    if (Array.isArray(mappedChild)) {
      let escapedChildKey = '';

      if (childKey != null)
        escapedChildKey = escapeUserProvidedKey(childKey) + '/';

      mapIntoArray(mappedChild, array, escapedChildKey, '', (c) => c);
    } else if (mappedChild !== null) {
      if (isValidElement(mappedChild)) {
        mappedChild = cloneAndReplaceKey(
          mappedChild,
          escapedPrefix +
            (mappedChild.key &&
            (!child || child.key !== mappedChild.key)
              ? escapeUserProvidedKey('' + mappedChild.key) + '/'
              : '') +
            childKey
        );
      }
      array.push(mappedChild);
    }
    return 1;
  }

  let child;
  let nextName;
  let subtreeCount = 0;
  const nextNamePrefix =
    nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children))
    children.forEach((child, i) => {
      nextName = nextNamePrefix + getElementKey(child, i);
      subtreeCount += mapIntoArray(
        child,
        array,
        escapedPrefix,
        nextName,
        callback
      );
    });
  else {
    const iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      const iterableChildren = children;
      const iterator = iteratorFn.call(iterableChildren);

      let step;
      let ii = 0;
      while (!(step = iterator.next()).done) {
        child = step.value;
        nextName = nextNamePrefix + getElementKey(child, ii++);
        subtreeCount += mapIntoArray(
          child,
          array,
          escapedPrefix,
          nextName,
          callback
        );
      }
    } else if (type === 'object') {
      const childrenString = String(children);

      throw new Error(
        `Objects are not valid as a React child ${childrenString}`
      );
    }
  }
  return subtreeCount;
};

function mapChildren(children, func, context) {
  if (children === null) return children;

  const result = [];
  let count = 0;
  mapIntoArray(children, result, '', '', function (child) {
    return func.call(context, child, count++);
  });
  return result;
}

function forEachChildren(children, forEachFunc, forEachContext) {
  mapChildren(
    children,
    function (...args) {
      forEachFunc.apply(this, args);
    },
    forEachContext
  );
}

const countChildren = (children) => {
  let n = 0;
  mapChildren(children, () => n++);

  return n;
};

const toArray = (children) =>
  mapChildren(children, (child) => child) || [];

const onlyChild = (children) => {
  if (!isValidElement(children)) {
    throw new Error(
      'React.Children.only expected to receive a single React element child.'
    );
  }

  return children;
};

export {
  forEachChildren as forEach,
  mapChildren as map,
  countChildren as count,
  onlyChild as only,
  toArray,
};
