import React, { createContext, useState, FC } from 'react';

enum ThemeData {
  light,
  dark,
}

const ThemeContext = createContext(ThemeData.light);
ThemeContext.displayName = 'THEME';

const { Provider, Consumer, displayName } = ThemeContext;

// eslint-disable-next-line no-console
console.log(displayName);

const { light, dark } = ThemeData;

const ThemeText = () => (
  <Consumer>
    {(value) => (
      <span style={{ color: value === light ? 'salmon' : 'grey' }}>
        ToggleTheme
      </span>
    )}
  </Consumer>
);

const Toolbar: FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick}>
    <ThemeText />
  </button>
);

export const ContextExample = () => {
  const [theme, setTheme] = useState(light);

  return (
    <Provider value={theme}>
      <Toolbar onClick={() => setTheme(theme === light ? dark : light)} />
    </Provider>
  );
};
