const symbolFor = Symbol.for;
export const REACT_ELEMENT_TYPE = symbolFor('react.element');
export const REACT_PORTAL_TYPE = symbolFor('react.portal');
export const REACT_FRAGMENT_TYPE = symbolFor('react.fragment');
export const REACT_STRICT_MODE_TYPE = symbolFor('react.strict_mode');
export const REACT_PROFILER_TYPE = symbolFor('react.profiler');
export const REACT_PROVIDER_TYPE = symbolFor('react.provider');
export const REACT_CONTEXT_TYPE = symbolFor('react.context');
export const REACT_FORWARD_REF_TYPE = symbolFor('react.forward_ref');
export const REACT_SUSPENSE_TYPE = symbolFor('react.suspense');
export const REACT_SUSPENSE_LIST_TYPE = symbolFor('react.suspense_list');
export const REACT_MEMO_TYPE = symbolFor('react.memo');
export const REACT_LAZY_TYPE = symbolFor('react.lazy');
export const REACT_SCOPE_TYPE = symbolFor('react.scope');

export const REACT_CACHE_TYPE = symbolFor('react.cache');

const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';

export const getIteratorFn = (maybeIterable) => {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }

  return null;
};
