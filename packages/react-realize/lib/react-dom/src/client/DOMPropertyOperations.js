import {
  getPropertyInfo,
  shouldIgnoreAttribute,
  shouldRemoveAttribute,
  isAttributeNameSafe,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
} from '../shared/DOMProperty';

import { sanitizeURL } from '../shared/sanitizeURL';

const setValueForProperty = (node, name, value, isCustomComponentTag) => {
  const propertyInfo = getPropertyInfo(name);

  if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) return;

  if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
    value = null;
  }

  if (isCustomComponentTag || propertyInfo === null) {
    if (isAttributeNameSafe(name)) {
      const attributeName = name;
      if (value === null) {
        node.removeAttribute(attributeName);
      } else {
        node.setAttribute(attributeName, `${value}`);
      }
    }
    return;
  }
  const { mustUseProperty } = propertyInfo;
  if (mustUseProperty) {
    const { propertyName } = propertyInfo;
    if (value === null) {
      const { type } = propertyInfo;
      node[propertyName] = type === BOOLEAN ? false : '';
    } else {
      node[propertyName] = value;
    }
    return;
  }

  const { attributeName, attributeNamespace } = propertyInfo;
  if (value === null) {
    node.removeAttribute(attributeName);
  } else {
    const { type } = propertyInfo;
    let attributeValue;
    if (type === BOOLEAN || (type === OVERLOADED_BOOLEAN && value === true)) {
      attributeValue = '';
    } else {
      attributeValue = '' + value;
      if (propertyInfo.sanitizeURL) {
        sanitizeURL(attributeValue.toString());
      }
    }
    if (attributeNamespace) {
      node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
    } else {
      node.setAttribute(attributeName, attributeValue);
    }
  }
};

export { setValueForProperty };
