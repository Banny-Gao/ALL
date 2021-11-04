const fs = require('fs-extra');
const path = require('path');
const resolve = require('resolve');

const webpack = require('webpack');
const { merge } = require('webpack-merge');
const htmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const {
  defaultBrowsers,
  InlineChunkHtmlPlugin,
  InterpolateHtmlPlugin,
  ModuleScopePlugin,
  ModuleNotFoundPlugin,
  getCSSModuleLocalIdent,
  getCacheIdentifier,
  createEnvironmentHash,
} = require('utils');

const getClientEnvironment = require('./env');
const paths = require('./paths');
const modules = require('./modules');

const reactRefreshRuntimeEntry = require.resolve(
  'react-refresh/runtime',
);
const reactRefreshWebpackPluginRuntimeEntry = require.resolve(
  '@pmmmwh/react-refresh-webpack-plugin',
);
const babelRuntimeEntry = require.resolve('babel-preset-react-app');
const babelRuntimeEntryHelpers = require.resolve(
  '@babel/runtime/helpers/esm/assertThisInitialized',
  { paths: [babelRuntimeEntry] },
);
const babelRuntimeRegenerator = require.resolve(
  '@babel/runtime/regenerator',
  {
    paths: [babelRuntimeEntry],
  },
);

const shouldInlineRuntimeChunk =
  process.env.INLINE_RUNTIME_CHUNK !== 'false';
const emitErrorsAsWarnings =
  process.env.ESLINT_NO_DEV_ERRORS === 'true';
const disableESLintPlugin =
  process.env.DISABLE_ESLINT_PLUGIN === 'true';

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000',
  10,
);
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const useTypeScript = fs.existsSync(paths.appTsConfig);
const { swSrc } = paths;

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }

  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

module.exports = (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  const isEnvProductionProfile =
    isEnvProduction && process.argv.includes('--profile');

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
  const shouldUseReactRefresh = env.raw.FAST_REFRESH;

  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: paths.publicUrlOrPath.startsWith('.')
          ? { publicPath: '../../' }
          : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            ident: 'postcss',
            plugins: [
              'postcss-flexbugs-fixes',
              [
                'postcss-preset-env',
                {
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                },
              ],
              'postcss-normalize',
            ],
          },
          sourceMap: isEnvProduction
            ? shouldUseSourceMap
            : isEnvDevelopment,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isEnvProduction
              ? shouldUseSourceMap
              : isEnvDevelopment,
            root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        },
      );
    }
    return loaders;
  };

  return {
    target: ['browserslist'],
    mode: isEnvProduction
      ? 'production'
      : isEnvDevelopment && 'development',
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'eval',
    entry: paths.appIndexJs,
    output: {
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/bundle.js',
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      publicPath: paths.publicPath,
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, '/')
        : isEnvDevelopment &&
          ((info) =>
            path
              .resolve(info.absoluteResourcePath)
              .replace(/\\/g, '/')),
    },
    cache: {
      type: 'filesystem',
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) =>
          fs.existsSync(f),
        ),
      },
      compression: 'gzip',
      infrastructureLogging: {
        level: 'none',
      },
      optimization: {
        chunkIds: true,
        emitOnErrors: isEnvProduction,
        mangleWasmImports: isEnvProduction,
        moduleIds: true,
        minimize: isEnvProduction,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              parse: {
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
              },
              mangle: {
                safari10: true,
              },
              keep_classnames:
                isEnvDevelopment || isEnvProductionProfile,
              keep_fnames: isEnvDevelopment || isEnvProductionProfile,
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
          }),
          new CssMinimizerPlugin(),
          '...',
        ],
      },
    },
  };
};
