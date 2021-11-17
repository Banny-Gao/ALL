import React, { useState } from 'react';
import './App.css';

import { JSX } from './JsxAndCreateElement';
import { LazyComponent } from './LazyComponent';

export default () => {
  const [state, setState] = useState({
    showLazyComponent: false,
    lazyComponentLoadedCount: 0,
  });

  return (
    <>
      <JSX />
      <>
        <p
          onClick={() =>
            setState((prevState) => {
              const { showLazyComponent, lazyComponentLoadedCount } =
                state;
              const newCount = showLazyComponent
                ? lazyComponentLoadedCount
                : lazyComponentLoadedCount + 1;

              return {
                ...prevState,
                showLazyComponent: !showLazyComponent,
                lazyComponentLoadedCount: newCount,
              };
            })
          }
        >
          Toggle LazyComponent
        </p>
        {state.showLazyComponent && (
          <LazyComponent
            showLoading
            title={`Lazy Component Loaded Count ${state.lazyComponentLoadedCount}`}
          />
        )}
      </>
    </>
  );
};
