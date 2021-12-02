const Bundles = require('./bundles');

const {
  NODE_ES2015,
  NODE_ESM,
  UMD_DEV,
  UMD_PROD,
  UMD_PROFILING,
  NODE_DEV,
  NODE_PROD,
  NODE_PROFILING,
} = Bundles.bundleTypes;

function getPackageName(name) {
  if (name.indexOf('/') !== -1) {
    return name.split('/')[0];
  }
  return name;
}

function getBundleOutputPath(bundleType, filename, packageName) {
  switch (bundleType) {
    case NODE_ES2015:
      return `build/${packageName}/cjs/${filename}`;
    case NODE_ESM:
      return `build/${packageName}/esm/${filename}`;
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
      return `build/${packageName}/cjs/${filename}`;
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
      return `build/${packageName}/umd/${filename}`;
    default:
      throw new Error('Unknown bundle type.');
  }
}

let entryPointsToHasBundle = new Map();
// eslint-disable-next-line no-for-of-loops/no-for-of-loops
for (const bundle of Bundles.bundles) {
  let hasBundle = entryPointsToHasBundle.get(bundle.entry);
  if (!hasBundle) {
    entryPointsToHasBundle.set(
      bundle.entry,
      bundle.bundleTypes.length > 0
    );
  }
}

module.exports = {
  getPackageName,
  getBundleOutputPath,
};
