const toString = (value) => {
  return '' + value;
};

const getToStringValue = (value) => {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'object':
    case 'string':
    case 'undefined':
      return value;
    default:
      return '';
  }
};

export { toString, getToStringValue };
