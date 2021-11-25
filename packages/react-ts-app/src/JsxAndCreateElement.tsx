import React, { createElement, createFactory, FC } from 'react';

const H2: FC<{ title: string }> = ({ title }) => <h2>{title}</h2>;

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
      {createFactory(H2)({ title: 'createFactory h2' })}
    </>
  );
};
