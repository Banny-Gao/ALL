import { REACT_ELEMENT_TYPE } from '../../ReactSymbols';

const ReactElement = (type, key, ref, owner, props) => ({
  // This tag allows us to uniquely identify this as a React Element
  $$typeof: REACT_ELEMENT_TYPE,

  // Built-in properties that belong on the element
  type: type,
  key: key,
  ref: ref,
  props: props,

  // Record the component responsible for creating this element.
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
