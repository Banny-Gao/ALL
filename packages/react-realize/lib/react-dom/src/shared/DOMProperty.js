const properties = {};

const RESERVED = 0;
const BOOLEAN = 3;
const OVERLOADED_BOOLEAN = 4;
const NUMERIC = 5;
const POSITIVE_NUMERIC = 6;

const getPropertyInfo = (name) => {
  return properties.hasOwnProperty(name) ? properties[name] : null;
};

const shouldIgnoreAttribute = (name, propertyInfo, isCustomComponentTag) => {
  if (propertyInfo !== null) return propertyInfo.type === RESERVED;

  if (isCustomComponentTag) return false;

  if (
    name.length > 2 &&
    (name[0] === 'o' || name[0] === 'O') &&
    (name[1] === 'n' || name[1] === 'N')
  )
    return true;

  return false;
};

const shouldRemoveAttributeWithWarning = (
  name,
  value,
  propertyInfo,
  isCustomComponentTag
) => {
  if (propertyInfo !== null && propertyInfo.type === RESERVED) return false;

  switch (typeof value) {
    case 'function':
    case 'symbol':
      return true;
    case 'boolean': {
      if (isCustomComponentTag) return false;
      if (propertyInfo !== null) return !propertyInfo.acceptsBooleans;

      const prefix = name.toLowerCase().slice(0, 5);
      return prefix !== 'data-' && prefix !== 'aria-';
    }
    default:
      return false;
  }
};

const shouldRemoveAttribute = (
  name,
  value,
  propertyInfo,
  isCustomComponentTag
) => {
  if (value === null || typeof value === 'undefined') return true;

  if (
    shouldRemoveAttributeWithWarning(
      name,
      value,
      propertyInfo,
      isCustomComponentTag
    )
  )
    return true;

  if (isCustomComponentTag) return false;

  if (propertyInfo !== null) {
    switch (propertyInfo.type) {
      case BOOLEAN:
        return !value;
      case OVERLOADED_BOOLEAN:
        return value === false;
      case NUMERIC:
        return isNaN(value);
      case POSITIVE_NUMERIC:
        return isNaN(value) || value < 1;
    }
  }
  return false;
};

const hasOwnProperty = Object.prototype.hasOwnProperty;
const illegalAttributeNameCache = {};
const validatedAttributeNameCache = {};

const isAttributeNameSafe = (attributeName) => {
  if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
    return true;
  }
  if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
    return false;
  }
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }
  illegalAttributeNameCache[attributeName] = true;

  return false;
};

export {
  getPropertyInfo,
  shouldIgnoreAttribute,
  RESERVED,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
  NUMERIC,
  POSITIVE_NUMERIC,
  shouldRemoveAttributeWithWarning,
  shouldRemoveAttribute,
  isAttributeNameSafe,
};
