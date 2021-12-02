import { REACT_ELEMENT_TYPE } from '../../ReactSymbols';

const ReactElement = function (
  type,
  key,
  ref,
  self,
  source,
  owner,
  props
) {};

export const isValidElement = (object) =>
  typeof object === 'object' &&
  object !== null &&
  object.$$typeof === REACT_ELEMENT_TYPE;

export const cloneAndReplaceKey = (oldElement, newKey) => {
  const newElement = ReactElement(
    oldElement.type,
    newKey,
    oldElement.ref,
    oldElement._self,
    oldElement._source,
    oldElement._owner,
    oldElement.props
  );

  return newElement;
};
