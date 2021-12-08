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
import { createRef } from './ReactCreateRef';
import { createContext } from './ReactContext';
import { forwardRef } from './ReactForwardRef';
import { lazy } from './ReactLazy';
import { memo } from './ReactMemo';

import { ReactSharedInternals } from './ReactSharedInternals';

import {
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useReducer,
} from './ReactHooks';

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
  createRef,
  forwardRef,
  createContext,
  lazy,
  memo,
  ReactSharedInternals as _BOOM_BOOM_BOOM,
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useReducer,
};
