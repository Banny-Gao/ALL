const isCheckable = (elem) => {
  const type = elem.type;
  const nodeName = elem.nodeName;
  return (
    nodeName &&
    nodeName.toLowerCase() === 'input' &&
    (type === 'checkbox' || type === 'radio')
  );
};

const detachTracker = (node) => {
  node._valueTracker = null;
};

const trackValueOnNode = (node) => {
  const valueField = isCheckable(node) ? 'checked' : 'value';
  const descriptor = Object.getOwnPropertyDescriptor(
    node.constructor.prototype,
    valueField
  );

  let currentValue = '' + node[valueField];

  if (
    node.hasOwnProperty(valueField) ||
    typeof descriptor === 'undefined' ||
    typeof descriptor.get !== 'function' ||
    typeof descriptor.set !== 'function'
  )
    return;

  const { get, set } = descriptor;
  Object.defineProperty(node, valueField, {
    configurable: true,
    get: function () {
      return get.call(this);
    },
    set: function (value) {
      currentValue = '' + value;
      set.call(this, value);
    },
  });

  Object.defineProperty(node, valueField, {
    enumerable: descriptor.enumerable,
  });

  const tracker = {
    getValue() {
      return currentValue;
    },
    setValue(value) {
      currentValue = '' + value;
    },
    stopTracking() {
      detachTracker(node);
      delete node[valueField];
    },
  };
  return tracker;
};

const getTracker = (node) => node._valueTracker;

const track = (node) => {
  if (getTracker(node)) return;

  node._valueTracker = trackValueOnNode(node);
};

export { track };
