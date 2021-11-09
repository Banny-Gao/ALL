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

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs]))
  process.exit(1);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

checkBrowsers(paths.appPath)
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
      paths.appPublic.slice(0, -1),
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
      paths.publicUrlOrPath,
    );

    const serverConfig = {
      ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
      host: HOST,
      port,
    };
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
