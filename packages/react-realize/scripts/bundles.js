const bundleTypes = {
  NODE_ES2015: 'NODE_ES2015',
  NODE_ESM: 'NODE_ESM',
  UMD_DEV: 'UMD_DEV',
  UMD_PROD: 'UMD_PROD',
  UMD_PROFILING: 'UMD_PROFILING',
  NODE_DEV: 'NODE_DEV',
  NODE_PROD: 'NODE_PROD',
  NODE_PROFILING: 'NODE_PROFILING',
};

const {
  NODE_ES2015,
  NODE_ESM,
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
} = bundleTypes;

const moduleTypes = {
  // React
  ISOMORPHIC: 'ISOMORPHIC',
  // Individual renderers. They bundle the reconciler. (e.g. ReactDOM)
  RENDERER: 'RENDERER',
  // Helper packages that access specific renderer's internals. (e.g. TestUtils)
  RENDERER_UTILS: 'RENDERER_UTILS',
  // Standalone reconciler for third-party renderers.
  RECONCILER: 'RECONCILER',
};

const { ISOMORPHIC, RENDERER, RENDERER_UTILS, RECONCILER } =
  moduleTypes;

const bundles = [
  /******* Isomorphic *******/
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      UMD_PROFILING,
      NODE_DEV,
      NODE_PROD,
    ],
    moduleType: ISOMORPHIC,
    entry: 'react',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: true,
  },

  /******* React JSX Runtime *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, NODE_PROFILING],
    moduleType: ISOMORPHIC,
    entry: 'react/jsx-runtime',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
  },

  /******* React JSX DEV Runtime *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, NODE_PROFILING],
    moduleType: ISOMORPHIC,
    entry: 'react/jsx-dev-runtime',
    minifyWithProdErrorCodes: false,
    wrapWithModuleBoundaries: false,
  },

  /******* React DOM *******/
  {
    bundleTypes: [
      UMD_DEV,
      UMD_PROD,
      UMD_PROFILING,
      NODE_DEV,
      NODE_PROD,
      NODE_PROFILING,
    ],
    moduleType: RENDERER,
    entry: 'react-dom',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
  },

  /******* React ART *******/
  {
    bundleTypes: [UMD_DEV, UMD_PROD, NODE_DEV, NODE_PROD],
    moduleType: RENDERER,
    entry: 'react-art',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
    babel: (opts) =>
      Object.assign({}, opts, {
        // Include JSX
        presets: opts.presets.concat([
          require.resolve('@babel/preset-react'),
          require.resolve('@babel/preset-flow'),
        ]),
        plugins: opts.plugins.concat([
          [
            require.resolve('@babel/plugin-transform-classes'),
            { loose: true },
          ],
        ]),
      }),
  },
  /******* React Reconciler *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, NODE_PROFILING],
    moduleType: RECONCILER,
    entry: 'react-reconciler',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
  },
  /******* Reconciler Reflection *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/reflection',

    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
  },
  /******* Reconciler Constants *******/
  {
    moduleType: RENDERER_UTILS,
    bundleTypes: [NODE_DEV, NODE_PROD],
    entry: 'react-reconciler/constants',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
  },
  /******* React Is *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD, UMD_DEV, UMD_PROD],
    moduleType: ISOMORPHIC,
    entry: 'react-is',

    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: false,
  },
  /******* React Scheduler (experimental) *******/
  {
    bundleTypes: [NODE_DEV, NODE_PROD],
    moduleType: ISOMORPHIC,
    entry: 'scheduler',
    minifyWithProdErrorCodes: true,
    wrapWithModuleBoundaries: true,
  },
];

// Based on deep-freeze by substack (public domain)
function deepFreeze(o) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
      o[prop] !== null &&
      (typeof o[prop] === 'object' || typeof o[prop] === 'function') &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

// Don't accidentally mutate config as part of the build
deepFreeze(bundles);
deepFreeze(bundleTypes);
deepFreeze(moduleTypes);

function getOriginalFilename(bundle, bundleType) {
  let name = bundle.name || bundle.entry;
  const globalName = (bundle.name = name // we do this to replace / to -, for react-dom/server
    .replace('/index.', '.')
    .replace('/', '-'));
  switch (bundleType) {
    case NODE_ES2015:
      return `${name}.js`;
    case NODE_ESM:
      return `${name}.js`;
    case UMD_DEV:
      return `${name}.development.js`;
    case UMD_PROD:
      return `${name}.production.min.js`;
    case UMD_PROFILING:
      return `${name}.profiling.min.js`;
    case NODE_DEV:
      return `${name}.development.js`;
    case NODE_PROD:
      return `${name}.production.min.js`;
    case NODE_PROFILING:
      return `${name}.profiling.min.js`;
  }
}

function getFilename(bundle, bundleType) {
  const originalFilename = getOriginalFilename(bundle, bundleType);
  // Ensure .server.js or .client.js is the final suffix.
  // This is important for the Server tooling convention.
  if (originalFilename.indexOf('.server.') !== -1) {
    return originalFilename
      .replace('.server.', '.')
      .replace('.js', '.server.js');
  }
  if (originalFilename.indexOf('.client.') !== -1) {
    return originalFilename
      .replace('.client.', '.')
      .replace('.js', '.client.js');
  }
  return originalFilename;
}

module.exports = {
  bundleTypes,
  moduleTypes,
  bundles,
  getFilename,
};
