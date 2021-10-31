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
