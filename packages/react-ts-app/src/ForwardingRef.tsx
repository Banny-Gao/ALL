import React, { forwardRef, MouseEventHandler } from 'react';

interface Props {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export const FancyButton = forwardRef<HTMLButtonElement, Props>(
  ({ onClick, children }, ref) => (
    <button ref={ref} onClick={onClick}>
      {children}
    </button>
  )
);
