import { REACT_LAZY_TYPE } from '../../ReactSymbols';

const Uninitialized = -1;
const Pending = 0;
const Resolved = 1;
const Rejected = 2;

const lazyInitializer = (payload) => {
  if (payload._status === Uninitialized) {
    const factory = payload._result;
    const thenable = factory();

    thenable.then(
      (moduleObject) => {
        if (
          payload._status === Pending ||
          payload._status === Uninitialized
        ) {
          const resolved = payload;
          resolved._status = Resolved;
          resolved._result = moduleObject;
        }
      },
      (error) => {
        if (
          payload._status === Pending ||
          payload._status === Uninitialized
        ) {
          const resolved = payload;
          resolved._status = Rejected;
          resolved._result = error;
        }
      }
    );

    if (payload._status === Uninitialized) {
      const pending = payload;
      pending._status = Pending;
      pending._result = thenable;
    }
  }

  if (payload._status === Resolved) {
    const moduleObject = payload._result;
    return moduleObject.default;
  } else {
    throw payload._result;
  }
};

export const lazy = (factory) => {
  const payload = {
    _status: Uninitialized,
    _result: factory,
  };

  const lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer,
  };

  return lazyType;
};
