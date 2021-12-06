import { REACT_ELEMENT_TYPE } from '../../ReactSymbols';
import { ReactCurrentOwner } from './ReactCurrentOwner';

const RESERVED_PROPS = {
  key: true,
  ref: true,
};

const ReactElement = (type, key, ref, owner, props) => ({
  $$typeof: REACT_ELEMENT_TYPE,

  type: type,
  key: key,
  ref: ref,
  props: props,
  _owner: owner,
});

export const isValidElement = (object) =>
  typeof object === 'object' &&
  object !== null &&
  object.$$typeof === REACT_ELEMENT_TYPE;

export const cloneAndReplaceKey = (oldElement, newKey) => {
  const newElement = ReactElement(
    oldElement.type,
    newKey,
    oldElement.ref,
    oldElement._owner,
    oldElement.props
  );

  return newElement;
};

export const createElement = (type, config, children) => {
  let propName;

  const props = {};
  let key = null;
  let ref = null;

  if (config != null) {
    if (config.ref !== undefined) ref = config.ref;

    if (config.key !== undefined) {
      key = '' + config.key;
    }

    for (propName in config) {
      if (
        Object.hasOwnProperty.call(config, propName) &&
        !Object.hasOwnProperty.call(RESERVED_PROPS, propName)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  props.children = children;

  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(type, key, ref, ReactCurrentOwner.current, props);
};

export const createFactory = (type) => {
  const factory = createElement.bind(null, type);
  factory.type = type;

  return factory;
};

export const cloneElement = (element, config, children) => {
  let propName;
  let owner = element._owner;

  const props = { ...element.props };

  if (config != null) {
    if (config.ref !== undefined) {
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }
    if (config.key !== undefined) key = '' + config.key;

    let defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !Object.hasOwnProperty.call(RESERVED_PROPS, propName)
      ) {
        if (
          config[propName] === undefined &&
          defaultProps !== undefined
        ) {
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  props.children = children;

  return ReactElement(element.type, key, ref, owner, props);
};
