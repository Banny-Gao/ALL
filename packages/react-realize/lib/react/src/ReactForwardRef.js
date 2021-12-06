import { REACT_FORWARD_REF_TYPE } from '../../ReactSymbols';

export const forwardRef = (render) => {
  const elementType = {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render,
  };

  return elementType;
};
