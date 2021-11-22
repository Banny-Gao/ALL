export const compose = (...fns) =>
  fns.reduceRight(
    (preFn, nextFn) =>
      (...args) =>
        nextFn(preFn(...args)),
    (value) => value
  );
