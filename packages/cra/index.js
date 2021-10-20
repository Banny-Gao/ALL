#!/usr/bin/env node

const chalk = require('chalk');
const { getNodeSemver } = require('utils');

const [major] = getNodeSemver();

if (major < 14) {
  // eslint-disable-next-line no-console
  console.log(chalk.red('Please update your version of Node.'));
  process.exit(1);
}

const { init } = require('./lib/cra');

init();
