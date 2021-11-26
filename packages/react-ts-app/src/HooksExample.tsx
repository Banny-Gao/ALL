/* eslint-disable no-console */
import React, {
  FC,
  useState,
  useContext,
  createContext,
  Dispatch,
  SetStateAction,
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

  return (
    <>
      <text style={{ color: theme.color }}>{theme.color}</text>
      <button onClick={() => theme.setColor('red')}>toggle red</button>
    </>
  );
};

export const HooksExample: FC = () => {
  const [clickCount1, setState] = useState(0);
  const [clickCount2, callbackSetState] = useCallbackState(0);

  const [color, setColor] = useState<string>('green');

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
