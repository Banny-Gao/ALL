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
export const REACT_SUSPENSE_LIST_TYPE = symbolFor(
  'react.suspense_list'
);
export const REACT_MEMO_TYPE = symbolFor('react.memo');
export const REACT_LAZY_TYPE = symbolFor('react.lazy');
export const REACT_SCOPE_TYPE = symbolFor('react.scope');
export const REACT_DEBUG_TRACING_MODE_TYPE = symbolFor(
  'react.debug_trace_mode'
);
export const REACT_OFFSCREEN_TYPE = symbolFor('react.offscreen');
export const REACT_LEGACY_HIDDEN_TYPE = symbolFor(
  'react.legacy_hidden'
);
export const REACT_CACHE_TYPE = symbolFor('react.cache');

export const getIteratorFn = (iterable) => iterable[Symbol.iterator];
