import { useState, useEffect, SetStateAction, useRef } from 'react';

export type CallbackDispatch<S> = (
  value: SetStateAction<S>,
  callback?: (state?: S) => void
) => void;

export const useCallbackState: <S>(
  initialState: S
) => [S, CallbackDispatch<S>] = (initialState) => {
  const [state, setState] = useState(initialState);
  const ref = useRef<(s?: typeof state) => void>();

  const callbackDispatch: CallbackDispatch<typeof state> = (
    value,
    callback
  ) => {
    ref.current = callback;
    setState(value);
  };

  useEffect(() => {
    ref.current?.call(null, state);

    return () => {};
  }, [state]);

  return [state, callbackDispatch];
};
