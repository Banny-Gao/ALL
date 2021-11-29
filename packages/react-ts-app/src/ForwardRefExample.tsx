import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  EventHandler,
  SyntheticEvent,
  RefObject,
} from 'react';

const FancyButton = forwardRef<HTMLInputElement>(
  ({ children }, ref) => (
    <input ref={ref} placeholder="click the lateral button">
      {children}
    </input>
  )
);

interface ICustomRef extends HTMLInputElement {
  focus: () => void;
}

const FancyInput = forwardRef<ICustomRef>(({ children }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    ref,
    () =>
      ({
        focus: () => {
          // eslint-disable-next-line no-console
          console.log('custom focus');
          inputRef.current?.focus();
        },
      } as ICustomRef)
  );

  return (
    <input
      ref={inputRef}
      placeholder="custom ref by useImperativeHandle"
    >
      {children}
    </input>
  );
});

export const ForwardRefExample = () => {
  const ref = useRef<HTMLInputElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const handleClick: <
    T extends RefObject<HTMLElement>,
    E extends SyntheticEvent
  >(
    r: T
  ) => EventHandler<E> = (r) => () => {
    r?.current?.focus();
  };

  return (
    <>
      <button onClick={handleClick(ref)}>forwardRef click</button>
      <FancyButton ref={ref} />
      <button onClick={handleClick(customRef)}>
        useImperativeHandle click
      </button>
      <FancyInput ref={customRef} />
    </>
  );
};
