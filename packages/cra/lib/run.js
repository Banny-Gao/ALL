/* eslint-disable no-console */
const prompts = require('prompts');
const chalk = require('chalk');
const semver = require('semver');
const fs = require('fs-extra');

const path = require('path');
const os = require('os');

const {
  getPackageInfo,
  checkIfOnline,
  install,
  checkNodeVersion,
  executeNodeScript,
} = require('utils');

const getInstallPackage = (version, originalDirectory) => {
  let scriptsToInstall = 'react-scripts';

  const validSemver = semver.valid(version);
  if (validSemver) {
    scriptsToInstall += `@${validSemver}`;
  } else if (version) {
    if (version[0] === '@' && !version.includes('/')) {
      scriptsToInstall += version;
    } else if (version.match(/^file:/)) {
      scriptsToInstall = `file:${path.resolve(
        originalDirectory,
        version.match(/^file:(.*)?$/)[1]
      )}`;
    } else {
      // for tar.gz or alternative paths
      scriptsToInstall = version;
    }
  }

  const scriptsToWarn = [
    {
      name: 'react-scripts-ts',
      message: chalk.yellow(
        `The react-scripts-ts package is deprecated. TypeScript is now supported natively in Create React App. You can use the ${chalk.green(
          '--template typescript'
        )} option instead when generating your app to include TypeScript support. Would you like to continue using react-scripts-ts?`
      ),
    },
  ];

  for (const script of scriptsToWarn) {
    if (scriptsToInstall.startsWith(script.name)) {
      return prompts({
        type: 'confirm',
        name: 'useScript',
        message: script.message,
        initial: false,
      }).then((answer) => {
        if (!answer.useScript) {
          process.exit(0);
        }

        return scriptsToInstall;
      });
    }
  }

  return Promise.resolve(scriptsToInstall);
};

const getTemplateInstallPackage = (template, originalDirectory) => {
  let templateToInstall = 'cra-template';
  if (template) {
    if (template.match(/^file:/)) {
      templateToInstall = `file:${path.resolve(
        originalDirectory,
        template.match(/^file:(.*)?$/)[1]
      )}`;
    } else if (
      template.includes('://') ||
      template.match(/^.+\.(tgz|tar\.gz)$/)
    ) {
      templateToInstall = template;
    } else {
      const packageMatch = template.match(/^(@[^/]+\/)?([^@]+)?(@.+)?$/);
      const scope = packageMatch[1] || '';
      const templateName = packageMatch[2] || '';
      const version = packageMatch[3] || '';

      if (
        templateName === templateToInstall ||
        templateName.startsWith(`${templateToInstall}-`)
      ) {
        templateToInstall = `${scope}${templateName}${version}`;
      } else if (version && !scope && !templateName) {
        templateToInstall = `${version}/${templateToInstall}`;
      } else {
        templateToInstall = `${scope}${templateToInstall}-${templateName}${version}`;
      }
    }
  }

  return Promise.resolve(templateToInstall);
};

const makeCaretRange = (dependencies, name) => {
  const version = dependencies[name];

  if (typeof version === 'undefined') {
    console.error(chalk.red(`Missing ${name} dependency in package.json`));
    process.exit(1);
  }

  let patchedVersion = `^${version}`;

  if (!semver.validRange(patchedVersion)) {
    console.error(
      `Unable to patch ${name} dependency version because version ${chalk.red(
        version
      )} will become invalid ${chalk.red(patchedVersion)}`
    );
    patchedVersion = version;
  }

  return { [name]: patchedVersion };
};

const setCaretRangeForRuntimeDeps = (packageName, root) => {
  const packagePath = path.join(root || process.cwd(), 'package.json');
  const packageJson = require(packagePath);

  const { dependencies } = packageJson;

  if (typeof dependencies === 'undefined') {
    console.error(chalk.red('Missing dependencies in package.json'));
    process.exit(1);
  }

  const packageVersion = dependencies[packageName];
  if (typeof packageVersion === 'undefined') {
    console.error(chalk.red(`Unable to find ${packageName} in package.json`));
    process.exit(1);
  }

  fs.writeFileSync(
    packagePath,
    JSON.stringify(
      {
        ...packageJson,
        dependencies: {
          ...dependencies,
          ...makeCaretRange(dependencies, 'react'),
          ...makeCaretRange(dependencies, 'react-dom'),
        },
      },
      null,
      2
    ) + os.EOL
  );
};

module.exports = async ({
  root,
  appName,
  scriptsVersion,
  verbose,
  originalDirectory,
  template,
  useYarn,
  usePnp,
}) => {
  try {
    const [scriptsToInstall, templateToInstall] = await Promise.all([
      getInstallPackage(scriptsVersion, originalDirectory),
      getTemplateInstallPackage(template, originalDirectory),
    ]);

    console.log(
      chalk.cyan('Installing packages. This might take a couple of minutes.')
    );

    const dependencies = [
      'react',
      'react-dom',
      scriptsToInstall,
      templateToInstall,
    ];

    const [packageInfo, templateInfo] = await Promise.all([
      getPackageInfo(scriptsToInstall),
      getPackageInfo(templateToInstall),
    ]);

    const isOnline = await checkIfOnline(useYarn);
    const { name: scriptsName } = packageInfo;
    const { name: templateName } = templateInfo;

    console.log(
      `Installing ${chalk.cyan('react')}, ${chalk.cyan(
        'react-dom'
      )}, and ${chalk.cyan(scriptsName)} with ${chalk.cyan(templateName)}...`
    );
    console.log();

    await install({
      root,
      useYarn,
      usePnp,
      dependencies,
      verbose,
      isOnline,
    });

    checkNodeVersion(scriptsName, root);
    setCaretRangeForRuntimeDeps(scriptsName, root);

    const pnpPath = path.resolve(process.cwd(), '.pnp.js');
    const nodeArgs = fs.existsSync(pnpPath) ? ['--require', pnpPath] : [];

    await executeNodeScript(
      {
        cwd: process.cwd(),
        args: nodeArgs,
      },
      [root, appName, verbose, originalDirectory, templateName],
      `
        const init = require('${scriptsName}/scripts/init.js');
        init.apply(null, JSON.parse(process.argv[1]));
      `
    );
  } catch (reason) {
    console.log();
    console.log('Aborting installation.');
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`);
    } else {
      console.log(chalk.red('Unexpected error. Please report it as a bug:'));
      console.log(reason);
    }
    console.log();

    const knownGeneratedFiles = ['package.json', 'yarn.lock', 'node_modules'];
    const currentFiles = fs.readdirSync(path.join(root));
    currentFiles.forEach((file) => {
      knownGeneratedFiles.forEach((fileToMatch) => {
        if (file === fileToMatch) {
          console.log(`Deleting generated file... ${chalk.cyan(file)}`);
          fs.removeSync(path.join(root, file));
        }
      });
    });

    const remainingFiles = fs.readdirSync(path.join(root));
    if (!remainingFiles.length) {
      console.log(
        `Deleting ${chalk.cyan(`${appName}/`)} from ${chalk.cyan(
          path.resolve(root, '..')
        )}`
      );
      process.chdir(path.resolve(root, '..'));
      fs.removeSync(path.join(root));
    }
    console.log('Done.');
    process.exit(1);
  }
};
