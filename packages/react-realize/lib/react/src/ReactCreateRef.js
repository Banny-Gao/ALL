export const createRef = () => {
  const refObject = {
    current: null,
  };
  Object.seal(refObject);

  return refObject;
};
