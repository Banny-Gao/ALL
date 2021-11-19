import React, { forwardRef, MouseEventHandler, useRef } from 'react';

const FancyButton = forwardRef<HTMLInputElement>(
  ({ children }, ref) => (
    <input ref={ref} placeholder="click the lateral button">
      {children}
    </input>
  )
);

export const ForwardRefExample = () => {
  const ref = useRef<HTMLInputElement>(null);

  const handleClick: MouseEventHandler<HTMLButtonElement> = () => {
    ref.current?.focus();
  };

  return (
    <>
      <button onClick={handleClick}>click</button>
      <FancyButton ref={ref} />
    </>
  );
};
