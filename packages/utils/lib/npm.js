/* eslint-disable no-console */
const spawn = require('cross-spawn');
const semver = require('semver');

const { execSync } = require('child_process');

const checkNpmCanReadCwd = () => {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
  } catch (err) {
    return true;
  }
  if (typeof childOutput !== 'string') {
    return true;
  }
  const lines = childOutput.split('\n');
  const prefix = '; cwd = ';
  const line = lines.find((item) => item.startsWith(prefix));

  if (typeof line !== 'string') {
    return true;
  }

  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }

  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD,
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`,
    ),
  );

  if (process.platform === 'win32') {
    console.error(
      `${chalk.red(
        `On Windows, this can usually be fixed by running:\n\n`,
      )}  ${chalk.cyan(
        'reg',
      )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          'reg',
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n${chalk.red(
          `Try to run the above two lines in the terminal.\n`,
        )}${chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`,
        )}`,
    );
  }

  return false;
};

const checkNpmVersion = () => {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync('npm --version').toString().trim();
    hasMinNpm = semver.gte(npmVersion, '6.0.0');
  } catch (err) {
    console.error(chalk.red(err));
  }
  return {
    hasMinNpm,
    npmVersion,
  };
};

const checkYarnVersion = () => {
  const minYarnPnp = '1.12.0';
  const maxYarnPnp = '2.0.0';
  let hasMinYarnPnp = false;
  let hasMaxYarnPnp = false;
  let yarnVersion = null;
  try {
    yarnVersion = execSync('yarnpkg --version').toString().trim();
    if (semver.valid(yarnVersion)) {
      hasMinYarnPnp = semver.gte(yarnVersion, minYarnPnp);
      hasMaxYarnPnp = semver.lt(yarnVersion, maxYarnPnp);
    } else {
      const trimmedYarnVersionMatch = /^(.+?)[-+].+$/.exec(yarnVersion);
      if (trimmedYarnVersionMatch) {
        const trimmedYarnVersion = trimmedYarnVersionMatch.pop();
        hasMinYarnPnp = semver.gte(trimmedYarnVersion, minYarnPnp);
        hasMaxYarnPnp = semver.lt(trimmedYarnVersion, maxYarnPnp);
      }
    }
  } catch (err) {
    console.error(chalk.red(err));
  }
  return {
    hasMinYarnPnp,
    hasMaxYarnPnp,
    yarnVersion,
  };
};

module.exports = {
  checkNpmCanReadCwd,
  checkNpmVersion,
  checkYarnVersion,
};
