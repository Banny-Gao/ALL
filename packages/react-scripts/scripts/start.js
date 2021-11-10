process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

process.on('unhandledRejection', (err) => {
  throw err;
});

require('../config/env');

const fs = require('fs-extra');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const semver = require('semver');

const {
  clearConsole,
  checkRequiredFiles,
  prepareProxy,
  prepareUrls,
  createCompiler,
  choosePort,
  checkBrowsers,
  openBrowser,
} = require('utils');

const paths = require('../config/paths');

const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');
const getClientEnvironment = require('../config/env');

const react = require(require.resolve('react', {
  paths: [paths.appPath],
}));
const env = getClientEnvironment(paths.publicPath.slice(0, -1));
const isInteractive = process.stdout.isTTY;

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs]))
  process.exit(1);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

checkBrowsers(paths.appPath, isInteractive)
  .then(() => choosePort(HOST, DEFAULT_PORT))
  .then((port) => {
    if (port === null) return;

    const config = configFactory('development');
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;

    const useTypeScript = fs.existsSync(paths.appTsConfig);
    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicPath.slice(0, -1),
    );

    const compiler = createCompiler({
      appName,
      urls,
      config,
      useTypeScript,
      webpack,
    });

    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(
      proxySetting,
      paths.appPublic,
      paths.publicPath,
    );

    const serverConfig = {
      ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
      host: HOST,
      port,
    };

    const devServer = new WebpackDevServer(serverConfig, compiler);

    devServer.startCallback(() => {
      if (isInteractive) {
        clearConsole();
      }

      if (env.raw.FAST_REFRESH && semver.lt(react.version, '16.10.0')) {
        console.log(
          chalk.yellow(
            `Fast Refresh requires React 16.10 or higher. You are using React ${react.version}.`,
          ),
        );
      }

      console.log(chalk.cyan('Starting the development server...\n'));
      openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        devServer.stop();
        process.exit();
      });
    });

    if (process.env.CI !== 'true') {
      process.stdin.on('end', function () {
        devServer.stop();
        process.exit();
      });
    }
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
