/* eslint-disable no-console */
const browserslist = require('browserslist');
const chalk = require('chalk');
const os = require('os');
const prompts = require('prompts');
const pkgUp = require('pkg-up');
const { readFileSync, writeFileSync } = require('fs-extra');
const { execSync } = require('child_process');
const open = require('open');

const { executeNodeScript } = require('./platform');

const defaultBrowsers = {
  production: ['>0.2%', 'not dead', 'not op_mini all'],
  development: [
    'last 1 chrome version',
    'last 1 firefox version',
    'last 1 safari version',
  ],
};

const Actions = Object.freeze({
  NONE: 0,
  BROWSER: 1,
  SCRIPT: 2,
});

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

  const pkg = JSON.parse(readFileSync(filePath, 'utf8'));
  pkg.browserslist = defaultBrowsers;
  writeFileSync(filePath, JSON.stringify(pkg, null, 2) + os.EOL);

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

const getBrowserEnv = () => {
  const value = process.env.BROWSER;
  const args = process.env.BROWSER_ARGS
    ? process.env.BROWSER_ARGS.split(' ')
    : [];
  let action;
  if (!value) {
    action = Actions.BROWSER;
  } else if (value.toLowerCase().endsWith('.js')) {
    action = Actions.SCRIPT;
  } else if (value.toLowerCase() === 'none') {
    action = Actions.NONE;
  } else {
    action = Actions.BROWSER;
  }
  return { action, value, args };
};

const startBrowserProcess = (browser, url, args) => {
  const shouldTryOpenChromiumWithAppleScript =
    process.platform === 'darwin' &&
    (typeof browser !== 'string' || browser === 'google chrome');

  if (shouldTryOpenChromiumWithAppleScript) {
    const supportedChromiumBrowsers = [
      'Google Chrome Canary',
      'Google Chrome',
      'Microsoft Edge',
      'Brave Browser',
      'Vivaldi',
      'Chromium',
    ];

    for (const chromiumBrowser of supportedChromiumBrowsers) {
      try {
        execSync(`ps cax | grep "${chromiumBrowser}"`);
        execSync(
          `osascript openChrome.applescript "${encodeURI(
            url,
          )}" "${chromiumBrowser}"`,
          {
            cwd: __dirname,
            stdio: 'ignore',
          },
        );
        return true;
      } catch (err) {
        // Ignore errors.
      }
    }
  }

  if (process.platform === 'darwin' && browser === 'open')
    browser = undefined;

  if (typeof browser === 'string' && args.length > 0)
    browser = [browser].concat(args);

  try {
    const options = { app: browser, wait: false, url: true };
    open(url, options).catch(() => {});
    return true;
  } catch (err) {
    return false;
  }
};

const openBrowser = (url) => {
  const { action, value, args } = getBrowserEnv();

  switch (action) {
    case Actions.NONE:
      return false;
    case Actions.SCRIPT:
      return executeNodeScript({
        cwd: process.cwd(),
        args: [value, ...process.argv.slice(2).url],
      });
    case Actions.BROWSER:
      return startBrowserProcess(value, url, args);
    default:
      throw new Error('Not implemented.');
  }
};

module.exports = {
  defaultBrowsers,
  checkBrowsers,
  openBrowser,
};
