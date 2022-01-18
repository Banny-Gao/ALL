import { getToStringValue, toString } from './ToStringValue';
import { setValueForProperty } from './DOMPropertyOperations';
import { getActiveElement } from './getActiveElement';

const isControlled = (props) => {
  const usesChecked = props.type === 'checkbox' || props.type === 'radio';
  return usesChecked ? props.checked != null : props.value != null;
};

const initWrapperState = (element, props) => {
  const node = element;
  const defaultValue = props.defaultValue == null ? '' : props.defaultValue;

  node._wrapperState = {
    initialChecked:
      props.checked != null ? props.checked : props.defaultChecked,
    initialValue: getToStringValue(
      props.value != null ? props.value : defaultValue
    ),
    controlled: isControlled(props),
  };
};

const getHostProps = (element, props) => {
  const node = element;
  const checked = props.checked;

  const hostProps = Object.assign({}, props, {
    defaultChecked: undefined,
    defaultValue: undefined,
    value: undefined,
    checked: checked != null ? checked : node._wrapperState.initialChecked,
  });

  return hostProps;
};

const postMountWrapper = (element, props, isHydrating) => {
  const node = element;

  if (props.hasOwnProperty('value') || props.hasOwnProperty('defaultValue')) {
    const type = props.type;
    const isButton = type === 'submit' || type === 'reset';

    if (isButton && (props.value === undefined || props.value === null)) return;

    const initialValue = toString(node._wrapperState.initialValue);

    if (!isHydrating && initialValue !== node.value) {
      node.value = initialValue;
    }

    node.defaultValue = initialValue;
  }

  const name = node.name;
  if (name !== '') {
    node.name = '';
  }

  node.defaultChecked = !node.defaultChecked;
  node.defaultChecked = !!node._wrapperState.initialChecked;

  if (name !== '') {
    node.name = name;
  }
};

const updateChecked = (element, props) => {
  const node = element;
  const checked = props.checked;
  if (checked != null) {
    setValueForProperty(node, 'checked', checked, false);
  }
};

const setDefaultValue = (node, type, value) => {
  if (type !== 'number' || getActiveElement(node.ownerDocument) !== node) {
    if (value == null) {
      node.defaultValue = toString(node._wrapperState.initialValue);
    } else if (node.defaultValue !== toString(value)) {
      node.defaultValue = toString(value);
    }
  }
};

const updateWrapper = (element, props) => {
  const node = element;

  updateChecked(element, props);

  const value = getToStringValue(props.value);
  const type = props.type;

  if (value != null) {
    if (type === 'number') {
      if ((value === 0 && node.value === '') || node.value != value) {
        node.value = toString(value);
      }
    } else if (node.value !== toString(value)) {
      node.value = toString(value);
    }
  } else if (type === 'submit' || type === 'reset') {
    node.removeAttribute('value');
    return;
  }

  if (props.hasOwnProperty('value')) {
    setDefaultValue(node, props.type, value);
  } else if (props.hasOwnProperty('defaultValue')) {
    setDefaultValue(node, props.type, getToStringValue(props.defaultValue));
  }

  if (props.checked == null && props.defaultChecked != null) {
    node.defaultChecked = !!props.defaultChecked;
  }
};

export {
  initWrapperState,
  getHostProps,
  postMountWrapper,
  updateChecked,
  setDefaultValue,
  updateWrapper,
};
