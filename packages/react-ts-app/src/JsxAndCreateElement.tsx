import React, { createElement } from 'react';

export const JSX = () => {
  return (
    <>
      <h1
        onClick={() => {
          alert('jsx');
        }}
      >
        JSX H1
      </h1>
      {createElement(
        'h1',
        {
          onClick: () => {
            alert('createElement');
          },
        },
        'CreateElement h1'
      )}
    </>
  );
};
