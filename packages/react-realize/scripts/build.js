const rollup = require('rollup');
const babel = require('rollup-plugin-babel');

const commonjs = require('rollup-plugin-commonjs');
const replace = require('rollup-plugin-replace');
const stripBanner = require('rollup-plugin-strip-banner');
const chalk = require('chalk');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const codeFrame = require('babel-code-frame');

const Bundles = require('./bundles');
const Stats = require('./stats');
const Packaging = require('./packaging');
const { asyncRimRaf } = require('./utils');

const sizes = require('./plugins/sizes-plugin');

const RELEASE_CHANNEL = process.env.RELEASE_CHANNEL;

// Default to building in experimental mode. If the release channel is set via
// an environment variable, then check if it's "experimental".
const __EXPERIMENTAL__ =
  typeof RELEASE_CHANNEL === 'string'
    ? RELEASE_CHANNEL === 'experimental'
    : true;

// Errors in promises should be fatal.
let loggedErrors = new Set();
process.on('unhandledRejection', (err) => {
  if (loggedErrors.has(err)) {
    // No need to print it twice.
    process.exit(1);
  }
  throw err;
});

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

const { getFilename } = Bundles;

function parseRequestedNames(names, toCase) {
  let result = [];
  for (let i = 0; i < names.length; i++) {
    let splitNames = names[i].split(',');
    for (let j = 0; j < splitNames.length; j++) {
      let name = splitNames[j].trim();
      if (!name) {
        continue;
      }
      if (toCase === 'uppercase') {
        name = name.toUpperCase();
      } else if (toCase === 'lowercase') {
        name = name.toLowerCase();
      }
      result.push(name);
    }
  }
  return result;
}

const requestedBundleTypes = argv.type
  ? parseRequestedNames([argv.type], 'uppercase')
  : [];
const requestedBundleNames = parseRequestedNames(argv._, 'lowercase');

const isWatchMode = argv.watch;

const babelPlugins = [
  // These plugins filter out non-ES2015.
  '@babel/plugin-transform-flow-strip-types',
  ['@babel/plugin-proposal-class-properties', { loose: true }],
  'syntax-trailing-function-commas',
  // These use loose mode which avoids embedding a runtime.
  // TODO: Remove object spread from the source. Prefer Object.assign instead.
  [
    '@babel/plugin-proposal-object-rest-spread',
    { loose: true, useBuiltIns: true },
  ],
  '@babel/plugin-transform-for-of',
  // TODO: Remove array spread from the source. Prefer .apply instead.
  [
    '@babel/plugin-transform-spread',
    { loose: true, useBuiltIns: true },
  ],
  '@babel/plugin-transform-parameters',
  // TODO: Remove array destructuring from the source. Requires runtime.
  [
    '@babel/plugin-transform-destructuring',
    { loose: true, useBuiltIns: true },
  ],
];

const babelToES5Plugins = [
  // These plugins transform DEV mode. Closure compiler deals with these in PROD.
  '@babel/plugin-transform-arrow-functions',
  '@babel/plugin-transform-block-scoped-functions',
  '@babel/plugin-transform-shorthand-properties',
  '@babel/plugin-transform-computed-properties',
  [
    '@babel/plugin-transform-block-scoping',
    { throwIfClosureRequired: true },
  ],
];

function getBabelConfig(updateBabelOptions, isDevelopment) {
  let options = {
    exclude: '/**/node_modules/**',
    babelrc: false,
    configFile: false,
    presets: [],
    plugins: [...babelPlugins],
  };
  if (isDevelopment) {
    options.plugins.push(
      ...babelToES5Plugins
      // Turn console.error/warn() into a custom wrapper
    );
  }
  if (updateBabelOptions) {
    options = updateBabelOptions(options);
  }

  return options;
}

function getRollupOutputOptions(outputPath, format, bundleType) {
  const isProduction = isProductionBundleType(bundleType);

  return {
    file: outputPath,
    format,
    freeze: !isProduction,
    interop: false,
    sourcemap: false,
    esModule: false,
  };
}

function getFormat(bundleType) {
  switch (bundleType) {
    case UMD_DEV:
    case UMD_PROD:
    case UMD_PROFILING:
      return `umd`;
    case NODE_ES2015:
    case NODE_DEV:
    case NODE_PROD:
    case NODE_PROFILING:
      return `cjs`;
    case NODE_ESM:
      return `es`;
  }
}

function isProductionBundleType(bundleType) {
  switch (bundleType) {
    case NODE_ES2015:
    case NODE_ESM:
    case UMD_DEV:
    case NODE_DEV:
      return false;
    case UMD_PROD:
    case NODE_PROD:
    case UMD_PROFILING:
    case NODE_PROFILING:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function isProfilingBundleType(bundleType) {
  switch (bundleType) {
    case NODE_ES2015:
    case NODE_ESM:
    case NODE_DEV:
    case NODE_PROD:

    case UMD_DEV:
    case UMD_PROD:
      return false;

    case NODE_PROFILING:
    case UMD_PROFILING:
      return true;
    default:
      throw new Error(`Unknown type: ${bundleType}`);
  }
}

function forbidFBJSImports() {
  return {
    name: 'forbidFBJSImports',
    resolveId(importee, importer) {
      if (/^fbjs\//.test(importee)) {
        throw new Error(
          `Don't import ${importee} (found in ${importer}). ` +
            `Use the utilities in packages/shared/ instead.`
        );
      }
    },
  };
}

function getPlugins(
  entry,
  updateBabelOptions,
  filename,
  packageName,
  bundleType,
  bundle
) {
  const isProduction = isProductionBundleType(bundleType);
  const isProfiling = isProfilingBundleType(bundleType);
  const isUMDBundle =
    bundleType === UMD_DEV ||
    bundleType === UMD_PROD ||
    bundleType === UMD_PROFILING;

  return [
    // Ensure we don't try to bundle any fbjs modules.
    forbidFBJSImports(),
    // Remove license headers from individual modules
    stripBanner({
      exclude: 'node_modules/**/*',
    }),
    // Compile to ES2015.
    babel(getBabelConfig(updateBabelOptions, !isProduction)),
    // Remove 'use strict' from individual source files.
    {
      transform(source) {
        return source.replace(/['"]use strict["']/g, '');
      },
    },
    // Turn __DEV__ and process.env checks into constants.
    replace({
      __DEV__: isProduction ? 'false' : 'true',
      __PROFILE__: isProfiling || !isProduction ? 'true' : 'false',
      __UMD__: isUMDBundle ? 'true' : 'false',
      'process.env.NODE_ENV': isProduction
        ? "'production'"
        : "'development'",
      __EXPERIMENTAL__,
      // Enable forked reconciler.
      // NOTE: I did not put much thought into how to configure this.
      __VARIANT__: bundle.enableNewReconciler === true,
    }),
    // The CommonJS plugin *only* exists to pull "art" into "react-art".
    // I'm going to port "art" to ES modules to avoid this problem.
    // Please don't enable this for anything else!
    isUMDBundle && entry === 'react-art' && commonjs(),
    // Record bundle size.
    sizes({
      getSize: (size, gzip) => {
        const currentSizes = Stats.currentBuildResults.bundleSizes;
        const recordIndex = currentSizes.findIndex(
          (record) =>
            record.filename === filename &&
            record.bundleType === bundleType
        );
        const index =
          recordIndex !== -1 ? recordIndex : currentSizes.length;
        currentSizes[index] = {
          filename,
          bundleType,
          packageName,
          size,
          gzip,
        };
      },
    }),
  ].filter(Boolean);
}

function shouldSkipBundle(bundle, bundleType) {
  const shouldSkipBundleType =
    bundle.bundleTypes.indexOf(bundleType) === -1;
  if (shouldSkipBundleType) {
    return true;
  }
  if (requestedBundleTypes.length > 0) {
    const isAskingForDifferentType = requestedBundleTypes.every(
      (requestedType) => bundleType.indexOf(requestedType) === -1
    );
    if (isAskingForDifferentType) {
      return true;
    }
  }
  if (requestedBundleNames.length > 0) {
    const isAskingForDifferentNames = requestedBundleNames.every(
      // If the name ends with `something/index` we only match if the
      // entry ends in something. Such as `react-dom/index` only matches
      // `react-dom` but not `react-dom/server`. Everything else is fuzzy
      // search.
      (requestedName) =>
        (bundle.entry + '/index.js').indexOf(requestedName) === -1
    );
    if (isAskingForDifferentNames) {
      return true;
    }
  }
  return false;
}

function resolveEntryFork(resolvedEntry) {
  // Pick which entry point fork to use:
  // .modern.fb.js
  // .classic.fb.js
  // .fb.js
  // .stable.js
  // .experimental.js
  // .js

  const resolvedForkedEntry = resolvedEntry.replace(
    '.js',
    __EXPERIMENTAL__ ? '.experimental.js' : '.stable.js'
  );
  if (fs.existsSync(resolvedForkedEntry)) {
    return resolvedForkedEntry;
  }
  // Just use the plain .js one.
  return resolvedEntry;
}

async function createBundle(bundle, bundleType) {
  if (shouldSkipBundle(bundle, bundleType)) {
    return;
  }

  const filename = getFilename(bundle, bundleType);
  const logKey =
    chalk.white.bold(filename) +
    chalk.dim(` (${bundleType.toLowerCase()})`);
  const format = getFormat(bundleType);
  const packageName = Packaging.getPackageName(bundle.entry);

  let resolvedEntry = resolveEntryFork(
    require.resolve(process.cwd() + '/lib/' + bundle.entry)
  );

  const rollupConfig = {
    input: resolvedEntry,
    plugins: getPlugins(
      bundle.entry,
      bundle.babel,
      filename,
      packageName,
      bundleType,
      bundle
    ),
    output: {
      externalLiveBindings: false,
      freeze: false,
      interop: false,
      esModule: false,
    },
  };
  const mainOutputPath = Packaging.getBundleOutputPath(
    bundleType,
    filename,
    packageName
  );
  const rollupOutputOptions = getRollupOutputOptions(
    mainOutputPath,
    format,
    bundleType
  );

  if (isWatchMode) {
    rollupConfig.output = [rollupOutputOptions];
    const watcher = rollup.watch(rollupConfig);
    watcher.on('event', async (event) => {
      switch (event.code) {
        case 'BUNDLE_START':
          console.log(
            `${chalk.bgYellow.black(' BUILDING ')} ${logKey}`
          );
          break;
        case 'BUNDLE_END':
          console.log(
            `${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`
          );
          break;
        case 'ERROR':
        case 'FATAL':
          console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
          handleRollupError(event.error);
          break;
      }
    });
  } else {
    console.log(`${chalk.bgYellow.black(' BUILDING ')} ${logKey}`);
    try {
      const result = await rollup.rollup(rollupConfig);
      await result.write(rollupOutputOptions);
    } catch (error) {
      console.log(`${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`);
      handleRollupError(error);
      throw error;
    }
    console.log(`${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`);
  }
}

function handleRollupError(error) {
  loggedErrors.add(error);
  if (!error.code) {
    console.error(error);
    return;
  }
  console.error(
    `\x1b[31m-- ${error.code}${
      error.plugin ? ` (${error.plugin})` : ''
    } --`
  );
  console.error(error.stack);
  if (error.loc && error.loc.file) {
    const { file, line, column } = error.loc;
    // This looks like an error from Rollup, e.g. missing export.
    // We'll use the accurate line numbers provided by Rollup but
    // use Babel code frame because it looks nicer.
    const rawLines = fs.readFileSync(file, 'utf-8');
    // column + 1 is required due to rollup counting column start position from 0
    // whereas babel-code-frame counts from 1
    const frame = codeFrame(rawLines, line, column + 1, {
      highlightCode: true,
    });
    console.error(frame);
  } else if (error.codeFrame) {
    // This looks like an error from a plugin (e.g. Babel).
    // In this case we'll resort to displaying the provided code frame
    // because we can't be sure the reported location is accurate.
    console.error(error.codeFrame);
  }
}

async function buildEverything() {
  if (!argv['unsafe-partial']) {
    await asyncRimRaf('build');
  }

  // Run them serially for better console output
  // and to avoid any potential race conditions.

  let bundles = [];
  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const bundle of Bundles.bundles) {
    bundles.push(
      [bundle, NODE_ES2015],
      [bundle, NODE_ESM],
      [bundle, UMD_DEV],
      [bundle, UMD_PROD],
      [bundle, UMD_PROFILING],
      [bundle, NODE_DEV],
      [bundle, NODE_PROD],
      [bundle, NODE_PROFILING]
    );
  }

  if (process.env.CIRCLE_NODE_TOTAL) {
    // In CI, parallelize bundles across multiple tasks.
    const nodeTotal = parseInt(process.env.CIRCLE_NODE_TOTAL, 10);
    const nodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
    bundles = bundles.filter((_, i) => i % nodeTotal === nodeIndex);
  }

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const [bundle, bundleType] of bundles) {
    await createBundle(bundle, bundleType);
  }

  await Packaging.prepareNpmPackages();

  console.log(Stats.printResults());
}

buildEverything();
