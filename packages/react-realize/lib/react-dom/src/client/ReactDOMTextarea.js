import { getToStringValue, toString } from './ToStringValue';

const invariant = require('invariant');

const getHostProps = (element, props) => {
  const node = element;
  invariant(
    props.dangerouslySetInnerHTML == null,
    '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
  );

  const hostProps = {
    ...props,
    value: undefined,
    defaultValue: undefined,
    children: toString(node._wrapperState.initialValue),
  };

  return hostProps;
};

const initWrapperState = (element, props) => {
  const node = element;

  let initialValue = props.value;

  if (initialValue == null) {
    let { children, defaultValue } = props;
    if (children != null) {
      invariant(
        defaultValue == null,
        'If you supply `defaultValue` on a <textarea>, do not pass children.'
      );
      if (Array.isArray(children)) {
        invariant(
          children.length <= 1,
          '<textarea> can only have at most one child.'
        );
        children = children[0];
      }

      defaultValue = children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    initialValue = defaultValue;
  }

  node._wrapperState = {
    initialValue: getToStringValue(initialValue),
  };
};

const postMountWrapper = (element, props) => {
  const node = element;

  const textContent = node.textContent;

  if (textContent === node._wrapperState.initialValue) {
    if (textContent !== '' && textContent !== null) {
      node.value = textContent;
    }
  }
};

const updateWrapper = (element, props) => {
  const node = element;
  const value = getToStringValue(props.value);
  const defaultValue = getToStringValue(props.defaultValue);
  if (value != null) {
    const newValue = toString(value);

    if (newValue !== node.value) {
      node.value = newValue;
    }
    if (props.defaultValue == null && node.defaultValue !== newValue) {
      node.defaultValue = newValue;
    }
  }
  if (defaultValue != null) {
    node.defaultValue = toString(defaultValue);
  }
};

export { initWrapperState, getHostProps, postMountWrapper, updateWrapper };
