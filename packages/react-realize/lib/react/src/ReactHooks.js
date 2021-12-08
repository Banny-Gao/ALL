import { ReactCurrentDispatcher } from './ReactCurrentDispatcher';

const resolveDispatcher = () => ReactCurrentDispatcher.current;

export const useState = (initialState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
};

export const useEffect = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
};

export const useCallback = (callback, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
};

export const useMemo = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
};

export const useLayoutEffect = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
};

export const useContext = (Context) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useContext(Context);
};

export const useReducer = (reducer, initialArg, init) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
};

export const useRef = (initialState) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialState);
};

export const useImperativeHandle = (ref, create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
};

export const useTransition = () => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
};

export const useDeferredValue = (value) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value);
};

export const useId = () => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useId();
};
