/* eslint-disable no-console */
const spawn = require('cross-spawn');
const semver = require('semver');
const tmp = require('tmp');
const fs = require('fs-extra');
const { unpack } = require('tar-pack');

const dns = require('dns');
const path = require('path');

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

const extractStream = (stream, dest) =>
  new Promise((resolve, reject) => {
    stream.pipe(
      unpack(dest, (err) => {
        if (err) reject(err);
        else resolve(dest);
      }),
    );
  });

const getPackageInfo = async (installPackage) => {
  if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
    try {
      const { tmpdir, cleanup } = await getTemporaryDirectory();

      let stream;
      if (/^http/.test(installPackage)) {
        stream = hyperquest(installPackage);
      } else {
        stream = fs.createReadStream(installPackage);
      }

      await extractStream(stream, tmpdir);

      const { name, version } = require.resolve(
        path.join(tmpdir, 'package.json'),
      );

      cleanup();
      return { name, version };
    } catch (err) {
      console.log(
        `Could not extract the package name from the archive: ${err.toString()}`,
      );
      const assumedProjectName = installPackage.match(
        /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/,
      )[1];
      console.log(
        `Based on the filename, assuming it is "${chalk.cyan(
          assumedProjectName,
        )}"`,
      );
      return { name: assumedProjectName };
    }
  }

  if (installPackage.startsWith('git+'))
    return {
      name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1],
    };

  if (installPackage.match(/.+@/))
    return {
      name:
        installPackage.charAt(0) +
        installPackage.substr(1).split('@')[0],
      version: installPackage.split('@')[1],
    };

  if (installPackage.match(/^file:/)) {
    const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
    const { name, version } = require.resolve(
      path.join(installPackagePath, 'package.json'),
    );
    return { name, version };
  }

  return { name: installPackage };
};

const getProxy = () => {
  let httpsProxy;

  if (process.env.https_proxy) httpsProxy = process.env.https_proxy;
  else {
    try {
      const npmProxy = execSync('npm config get https-proxy');
      npmProxy && (httpsProxy = npmProxy.toString().trim());
    } catch (e) {
      //
    }
  }

  return httpsProxy;
};

const checkIfOnline = (useYarn) =>
  new Promise((resolve) => {
    if (!useYarn) resolve(true);

    dns.lookup('registry.yarnpkg.com', (err) => {
      let proxy;
      if (err !== null && (proxy = getProxy())) {
        dns.lookup(new URL(proxy).hostname, (proxyErr) => {
          resolve(proxyErr == null);
        });
      } else resolve(err == null);
    });
  });

const install = ({
  root,
  useYarn,
  usePnp,
  dependencies,
  verbose,
  isOnline,
}) =>
  new Promise((resolve, reject) => {
    let command;
    let args;

    if (useYarn) {
      command = 'yarnpkg';
      args = ['add', '--exact'];

      !isOnline && args.push('--offline');
      usePnp && args.push('--enable-pnp');
      args.push(...dependencies);
      args.push('--cwd');
      args.push(root);

      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'));
        console.log(
          chalk.yellow('Falling back to the local Yarn cache.'),
        );
        console.log();
      }
    } else {
      command = 'npm';
      args = [
        'install',
        '--no-audit', // https://github.com/facebook/create-react-app/issues/11174
        '--save',
        '--save-exact',
        '--loglevel',
        'error',
        ...dependencies,
      ];

      if (usePnp) {
        console.log(chalk.yellow("NPM doesn't support PnP."));
        console.log(
          chalk.yellow('Falling back to the regular installs.'),
        );
        console.log();
      }
    }

    verbose && args.push('--verbose');

    spawn(command, args, { stdio: 'inherit' }).on('close', (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });

const checkNodeVersion = (packageName, root) => {
  const packageJsonPath = path.resolve(
    root || process.cwd(),
    'node_modules',
    packageName,
    'package.json',
  );

  if (!fs.existsSync(packageJsonPath)) return;

  const { engines } = require(packageJsonPath);

  if (!engines || !engines.node) return;

  if (!semver.satisfies(process.version, engines.node)) {
    console.error(
      chalk.red(
        `You are running Node %s.\n 
        ${packageName} requires Node %s or higher. \n
        Please update your version of Node.`,
      ),
      process.version,
      engines.node,
    );

    process.exit(1);
  }
};

module.exports = {
  checkNpmCanReadCwd,
  checkNpmVersion,
  checkYarnVersion,
  extractStream,
  getPackageInfo,
  getProxy,
  checkIfOnline,
  install,
  checkNodeVersion,
};
