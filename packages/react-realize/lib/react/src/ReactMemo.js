import { REACT_MEMO_TYPE } from '../../ReactSymbols';

export const memo = (type, compare) => {
  const elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare,
  };

  return elementType;
};
