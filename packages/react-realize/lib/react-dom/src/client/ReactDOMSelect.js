import { getToStringValue, toString } from './ToStringValue';

const initWrapperState = (element, props) => {
  const node = element;

  node._wrapperState = {
    wasMultiple: !!props.multiple,
  };
};

const getHostProps = (element, props) => {
  return Object.assign({}, props, {
    value: undefined,
  });
};

const updateOptions = (node, multiple, propValue, setDefaultSelected) => {
  const options = node.options;

  if (multiple) {
    const selectedValues = propValue;
    const selectedValue = {};
    for (let i = 0; i < selectedValues.length; i++) {
      selectedValue['$' + selectedValues[i]] = true;
    }
    for (let i = 0; i < options.length; i++) {
      const selected = selectedValue.hasOwnProperty('$' + options[i].value);
      if (options[i].selected !== selected) {
        options[i].selected = selected;
      }
      if (selected && setDefaultSelected) {
        options[i].defaultSelected = true;
      }
    }
  } else {
    const selectedValue = toString(getToStringValue(propValue));
    let defaultSelected = null;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === selectedValue) {
        options[i].selected = true;
        if (setDefaultSelected) {
          options[i].defaultSelected = true;
        }
        return;
      }
      if (defaultSelected === null && !options[i].disabled) {
        defaultSelected = options[i];
      }
    }
    if (defaultSelected !== null) {
      defaultSelected.selected = true;
    }
  }
};

const postMountWrapper = (element, props) => {
  const node = element;
  node.multiple = !!props.multiple;
  const value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  } else if (props.defaultValue != null) {
    updateOptions(node, !!props.multiple, props.defaultValue, true);
  }
};

const postUpdateWrapper = (element, props) => {
  const node = element;
  const wasMultiple = node._wrapperState.wasMultiple;
  node._wrapperState.wasMultiple = !!props.multiple;

  const value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  } else if (wasMultiple !== !!props.multiple) {
    if (props.defaultValue != null) {
      updateOptions(node, !!props.multiple, props.defaultValue, true);
    } else {
      updateOptions(node, !!props.multiple, props.multiple ? [] : '', false);
    }
  }
};

export { initWrapperState, getHostProps, postMountWrapper, postUpdateWrapper };
