/* eslint-disable no-console */

const commander = require('commander');
const chalk = require('chalk');
const envinfo = require('envinfo');
const semver = require('semver');

const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execSync } = require('child_process');

const {
  isUsingYarn,
  checkAppName,
  isSafeToCreateProjectIn,
  checkNpmCanReadCwd,
  checkNpmVersion,
  checkYarnVersion,
} = require('utils');

const pkg = require('../package.json');
const run = require('./run');

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
  directory,
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

  const root = path.resolve(path.join(directory, name));
  const appName = path.basename(root);

  if (!checkAppName(appName)) process.exit(1);
  fs.ensureDirSync(root);
  !isSafeToCreateProjectIn(root, appName) && process.exit(1);

  console.log();
  console.log(`Creating a new React app in ${chalk.green(root)}.`);
  console.log();

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  };
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL,
  );

  // 获取当前 node 进程目录
  const originalDirectory = process.cwd();
  // 改变 node 进程目录
  process.chdir(root);

  const useYarn = isUsingYarn();
  if (!useYarn && !checkNpmCanReadCwd()) process.exit(1);

  if (!useYarn) {
    const npmInfo = checkNpmVersion();
    console.log(npmInfo);
  } else if (usePnp) {
    const yarnInfo = checkYarnVersion();
    console.log(yarnInfo);
  }

  if (useYarn) {
    const yarnUsesDefaultRegistry =
      execSync('yarnpkg config get registry').toString().trim() ===
      'https://registry.yarnpkg.com';
    if (yarnUsesDefaultRegistry) {
      fs.copySync(
        require.resolve('../yarn.lock.cached'),
        path.join(root, 'yarn.lock'),
      );
    }
  }

  run({
    root,
    appName,
    scriptsVersion,
    verbose,
    originalDirectory,
    template,
    useYarn,
    usePnp,
  });
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
    .option('-u, --use-pnp')
    .option('-d, --directory [path]', 'base directory', '.')
    .allowUnknownOption()
    .parse(process.argv);

  const { info, verbose, scriptsVersion, template, usePnp, directory } =
    program.opts();

  info && logInfo();

  !projectName && process.exit(1);

  createApp({
    name: projectName,
    verbose,
    scriptsVersion,
    template,
    usePnp,
    directory,
  });
};

module.exports = {
  init,
};
