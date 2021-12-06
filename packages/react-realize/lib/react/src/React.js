import {
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
} from '../../ReactSymbols';
import { forEach, map, count, toArray, only } from './ReactChildren';
import {
  createElement,
  createFactory,
  cloneElement,
  isValidElement,
} from './ReactElement';
import { Component, PureComponent } from './ReactBaseClasses';

const Children = {
  map,
  forEach,
  count,
  toArray,
  only,
};

export {
  Children,
  createElement,
  createFactory,
  cloneElement,
  isValidElement,
  REACT_FRAGMENT_TYPE as Fragment,
  REACT_PROFILER_TYPE as Profiler,
  REACT_STRICT_MODE_TYPE as StrictMode,
  REACT_SUSPENSE_TYPE as Suspense,
  REACT_SUSPENSE_LIST_TYPE as SuspenseList,
  Component,
  PureComponent,
};
