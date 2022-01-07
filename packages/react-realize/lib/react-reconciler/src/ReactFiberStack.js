const valueStack = [];
let index = -1;

const createCursor = (defaultValue) => ({
  current: defaultValue,
});

const push = (cursor, value, fiber) => {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
};

const pop = (cursor, fiber) => {
  if (index < 0) return;

  cursor.current = valueStack[index];
  valueStack[index] = null;

  index--;
};

const isEmpty = () => index === -1;

export { createCursor, isEmpty, pop, push };
