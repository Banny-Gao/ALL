/* eslint-disable no-console */
const spawn = require('cross-spawn');
const semver = require('semver');
const tmp = require('tmp');

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

const getTemporaryDirectory = () =>
  new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true }, (err, tmpdir, callback) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          tmpdir,
          cleanup: () => {
            try {
              callback();
            } catch (ignored) {
              // Callback might throw and fail, since it's a temp directory the
              // OS will clean it up eventually...
            }
          },
        });
      }
    });
  });

const getPackageInfo = async (installPackage) => {
  if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
    try {
      const obj = await getTemporaryDirectory();
      let stream;
      if (/^http/.test(installPackage)) {
        stream = hyperquest(installPackage);
      } else {
        stream = fs.createReadStream(installPackage);
      }
      const obj2 = await extractStream(stream, obj.tmpdir).then(
        () => obj,
      );

      const { name, version } = require.resolve(
        path.join(obj2.tmpdir, 'package.json'),
      );
      obj2.cleanup();
      return { name, version };
    } catch (err) {
      console.log(
        `Could not extract the package name from the archive: ${err.message}`,
      );
      const assumedProjectName = installPackage.match(
        /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/,
      )[1];
      console.log(
        `Based on the filename, assuming it is "${chalk.cyan(
          assumedProjectName,
        )}"`,
      );
      return Promise.resolve({ name: assumedProjectName });
    }
  }
  if (installPackage.startsWith('git+')) {
    // Pull package name out of git urls e.g:
    // git+https://github.com/mycompany/react-scripts.git
    // git+ssh://github.com/mycompany/react-scripts.git#v1.2.3
    return Promise.resolve({
      name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1],
    });
  }
  if (installPackage.match(/.+@/)) {
    // Do not match @scope/ when stripping off @version or @tag
    return Promise.resolve({
      name:
        installPackage.charAt(0) +
        installPackage.substr(1).split('@')[0],
      version: installPackage.split('@')[1],
    });
  }
  if (installPackage.match(/^file:/)) {
    const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
    const { name, version } = require.resolve(
      path.join(installPackagePath, 'package.json'),
    );
    return Promise.resolve({ name, version });
  }
  return Promise.resolve({ name: installPackage });
};

module.exports = {
  checkNpmCanReadCwd,
  checkNpmVersion,
  checkYarnVersion,
};
