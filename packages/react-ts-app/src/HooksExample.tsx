/* eslint-disable no-console */
import React, {
  FC,
  useState,
  useContext,
  createContext,
  Dispatch,
  SetStateAction,
  useReducer,
  Reducer,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';

import { useCallbackState } from './hooks';

interface IColor {
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
}

const ThemeContext = createContext<IColor>({
  color: '',
  setColor: (value: SetStateAction<string>) => {},
});

const ThemeText = () => {
  const theme = useContext(ThemeContext);

  const memoriedTextRender = useCallback(
    () => <span style={{ color: theme.color }}>{theme.color}</span>,
    [theme.color]
  );
  const memoriedButton = useMemo(
    () => (
      <button onClick={() => theme.setColor('red')}>toggle red</button>
    ),
    [theme.color]
  );

  useEffect(() => {
    console.log('effect');
  });

  useLayoutEffect(() => {
    console.log('layout effect');
  });

  return (
    <>
      {memoriedTextRender()}
      {memoriedButton}
    </>
  );
};

enum ACTIONS {
  increment,
  decrement,
}

type ACTION = typeof ACTIONS[keyof typeof ACTIONS];

interface IAction {
  type: ACTION;
  payload?: number;
}

const initialState = {
  count: 0,
};

const reducer: Reducer<typeof initialState, IAction> = (
  prevState,
  { type, payload = 1 }
) => {
  let count = prevState.count;

  switch (type) {
    case ACTIONS.decrement:
      count -= payload;
      break;
    case ACTIONS.increment:
      count += payload;
  }

  return {
    ...prevState,
    count,
  };
};

export const HooksExample: FC = () => {
  const [clickCount1, setState] = useState(0);
  const [clickCount2, callbackSetState] = useCallbackState(0);

  const [color, setColor] = useState<string>('green');

  const [store, dispatch] = useReducer(reducer, initialState);

  return (
    <>
      <button
        onClick={() => setState((prevState) => (prevState >>> 0) + 1)}
      >
        {clickCount1}
      </button>
      <button
        onClick={() => {
          callbackSetState(clickCount2 + 1, (nextState) => {
            console.log(nextState);
          });
          console.log(clickCount2, '------------');
        }}
      >
        {clickCount2}
      </button>
      <button>
        <span onClick={() => dispatch({ type: ACTIONS.decrement })}>
          -
        </span>
        {store.count}
        <span onClick={() => dispatch({ type: ACTIONS.increment })}>
          +
        </span>
      </button>

      <br />

      <ThemeContext.Provider
        value={{
          color,
          setColor,
        }}
      >
        <ThemeText />
      </ThemeContext.Provider>
    </>
  );
};
