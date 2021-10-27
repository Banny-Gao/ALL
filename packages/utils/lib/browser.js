/* eslint-disable no-console */
const browserslist = require('browserslist');
const chalk = require('chalk');
const os = require('os');
const prompts = require('prompts');
const pkgUp = require('pkg-up');
const fs = require('fs-extra');

const defaultBrowsers = {
  production: ['>0.2%', 'not dead', 'not op_mini all'],
  development: [
    'last 1 chrome version',
    'last 1 firefox version',
    'last 1 safari version',
  ],
};

const shouldSetBrowsers = async (isInteractive) => {
  if (!isInteractive) return true;

  const question = {
    type: 'confirm',
    name: 'shouldSetBrowsers',
    message: `${chalk.yellow(
      "We're unable to detect target browsers.",
    )}\n\nWould you like to add the defaults to your ${chalk.bold(
      'package.json',
    )}?`,
    initial: true,
  };

  const answer = await prompts(question);
  return answer.shouldSetBrowsers;
};

const checkBrowsers = async (dir, isInteractive, retry = true) => {
  const current = browserslist.loadConfig({ path: dir });
  if (current != null) return current;

  if (!retry)
    return Promise.reject(
      new Error(
        `${os.EOL}Please add a ${chalk.underline(
          'browserslist',
        )} key to your ${chalk.bold('package.json')}.`,
      ),
    );

  const shouldSet = await shouldSetBrowsers(isInteractive);
  if (!shouldSet) return checkBrowsers(dir, isInteractive, false);

  const filePath = pkgUp({ cwd: dir });
  if (filePath === null) return Promise.reject();

  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  pkg.browserslist = defaultBrowsers;
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + os.EOL);

  browserslist.clearCaches();

  console.log();
  console.log(
    `${chalk.green('Set target browsers:')} ${chalk.cyan(
      defaultBrowsers.join(', '),
    )}`,
  );
  console.log();

  return true;
};

module.exports = {
  defaultBrowsers,
  checkBrowsers,
};
