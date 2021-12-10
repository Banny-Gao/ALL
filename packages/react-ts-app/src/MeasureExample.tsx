import React, { useState, useCallback, useRef, useEffect } from 'react';

export const MeasureExample = () => {
  const [rect, setRect] = useState<DOMRect>();
  const [growingText, setGrowingText] = useState<string>('');
  const intervalRef = useRef<any>();

  const measuredRef = useCallback(
    (node: HTMLElement) => {
      if (node !== null) {
        setRect(node.getBoundingClientRect());
      }
    },
    [growingText]
  );

  useEffect(() => {
    const id = setInterval(() => {
      setGrowingText(`${growingText} ${Date.now().toString()}`);
    }, 5000);

    intervalRef.current = id;

    return () => {
      clearInterval(intervalRef.current);
    };
  });

  return (
    <>
      <h1>
        <span ref={measuredRef}>{growingText}</span>
      </h1>
      {rect && (
        <h2 onClick={() => clearInterval(intervalRef.current)}>
          The above growing text is {~~rect.height}px tall, {~~rect.width}
          px long.
        </h2>
      )}
    </>
  );
};
