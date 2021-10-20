#!/usr/bin/env node
/* eslint-disable no-console */

const commander = require('commander');
const chalk = require('chalk');
const envinfo = require('envinfo');
const semver = require('semver');
const path = require('path');

const { isUsingYarn } = require('utils');

const pkg = require('../package.json');

let projectName;

const logInfo = () => {
  console.log(chalk.bold('\nEnvironment Info:'));
  return (
    envinfo
      .run(
        {
          System: ['OS', 'CPU'],
          Binaries: ['Node', 'npm', 'Yarn'],
          Browsers: [
            'Chrome',
            'Edge',
            'Internet Explorer',
            'Firefox',
            'Safari',
          ],
          npmPackages: ['react', 'react-dom', 'react-scripts'],
          npmGlobalPackages: ['create-react-app'],
        },
        {
          duplicates: true,
          showNotFound: true,
        },
      )
      // eslint-disable-next-line no-console
      .then(console.log)
  );
};

const createApp = ({
  name,
  verbose,
  scriptsVersion,
  template,
  usePnp,
}) => {
  const unSupportNode = !semver.satisfies(
    semver.coerce(process.version),
    '>=14',
  );

  if (unSupportNode) {
    console.log(
      chalk.yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 14 or higher for a better, fully supported experience.\n`,
      ),
    );
    process.exit(1);
  }

  const root = path.resolve(name);
  const appName = path.basename(root);
  console.log(appName);
};

const init = async () => {
  const program = new commander.Command(pkg.name)
    .version(pkg.version)
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory>')} [options]`)
    .action((name) => {
      projectName = name;
    })
    .option('--verbose', 'print additional logs')
    .option('--info', 'print environment debug info')
    .option(
      '--scripts-version <alternative-package>',
      'use a non-standard version of react-scripts',
    )
    .option(
      '--template <path-to-template>',
      'specify a template for the created project',
    )
    .option('--use-pnp')
    .allowUnknownOption()
    .parse(process.argv);

  const { info, verbose, scriptsVersion, template, usePnp } =
    program.opts();

  info && logInfo();

  !projectName && process.exit(1);

  createApp({
    name: projectName,
    verbose,
    scriptsVersion,
    template,
    usePnp,
  });
};

module.exports = {
  init,
};
