process.on('unhandledRejection', (err) => {
  throw err;
});

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const spawn = require('cross-spawn');
const os = require('os');

const { defaultBrowsers } = require('utils');

module.exports = ({
  root,
  appName,
  verbose,
  originalDirectory,
  templateName,
}) => {
  console.log('-----------');
  console.log(process.argv);
};
