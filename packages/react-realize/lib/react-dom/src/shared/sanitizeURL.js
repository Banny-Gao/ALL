const invariant = require('invariant');

const isJavaScriptProtocol =
  /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;

const sanitizeURL = (url) => {
  invariant(
    !isJavaScriptProtocol.test(url),
    'React has blocked a javascript: URL as a security precaution.'
  );
};

export { sanitizeURL };
