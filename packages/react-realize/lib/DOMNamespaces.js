const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const Namespaces = {
  html: HTML_NAMESPACE,
  mathml: MATH_NAMESPACE,
  svg: SVG_NAMESPACE,
};

// Assumes there is no parent namespace.
const getIntrinsicNamespace = (type) => {
  switch (type) {
    case 'svg':
      return SVG_NAMESPACE;
    case 'math':
      return MATH_NAMESPACE;
    default:
      return HTML_NAMESPACE;
  }
};

const getChildNamespace = (parentNamespace, type) => {
  if (parentNamespace == null || parentNamespace === HTML_NAMESPACE) {
    return getIntrinsicNamespace(type);
  }
  if (parentNamespace === SVG_NAMESPACE && type === 'foreignObject') {
    return HTML_NAMESPACE;
  }
  return parentNamespace;
};

export {
  HTML_NAMESPACE,
  MATH_NAMESPACE,
  SVG_NAMESPACE,
  Namespaces,
  getIntrinsicNamespace,
  getChildNamespace,
};
