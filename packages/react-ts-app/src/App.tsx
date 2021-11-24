import React, { useState, Profiler } from 'react';
import './App.css';

import { JSX } from './JsxAndCreateElement';
import { LazyComponent } from './LazyComponent';
import { ContextExample } from './ContextExample';

import { ErrorBoundary, BuggyCounter } from './ErrorBoundary';
import { ForwardRefExample } from './ForwardRefExample';
import { MeasureExample } from './MeasureExample';

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
          <Profiler
            id="Navigation"
            onRender={(...args) => {
              // eslint-disable-next-line no-console
              console.table(args);
            }}
          >
            <LazyComponent
              showLoading
              title={`Lazy Component Loaded Count ${state.lazyComponentLoadedCount}`}
            />
          </Profiler>
        )}
      </>

      <br />
      <ContextExample />

      <br />
      <ErrorBoundary>
        <BuggyCounter />
      </ErrorBoundary>

      <br />
      <ForwardRefExample />

      <br />
      <MeasureExample />
    </>
  );
};
