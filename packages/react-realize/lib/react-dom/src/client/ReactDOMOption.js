import * as React from '../../../react';

import { getToStringValue, toString } from './ToStringValue';

const flattenChildren = (children) => {
  let content = '';

  React.Children.forEach(children, function (child) {
    if (child == null) {
      return;
    }
    content += child;
  });

  return content;
};

const getHostProps = (element, props) => {
  const hostProps = { children: undefined, ...props };
  const content = flattenChildren(props.children);

  if (content) {
    hostProps.children = content;
  }

  return hostProps;
};

const postMountWrapper = (element, props) => {
  if (props.value != null) {
    element.setAttribute('value', toString(getToStringValue(props.value)));
  }
};

export { getHostProps, postMountWrapper };
