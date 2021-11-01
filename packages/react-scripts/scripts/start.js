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

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs]))
  process.exit(1);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

checkBrowsers(paths.appPath)
  .then(() => choosePort(HOST, DEFAULT_PORT))
  .then((port) => {
    if (port === null) return
    
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
