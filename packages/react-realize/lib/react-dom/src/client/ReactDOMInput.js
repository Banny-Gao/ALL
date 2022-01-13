import { getToStringValue, toString } from './ToStringValue';

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

export { initWrapperState, getHostProps, postMountWrapper };
