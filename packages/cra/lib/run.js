/* eslint-disable no-console */
const prompts = require('prompts');
const chalk = require('chalk');
const semver = require('semver');

const getInstallPackage = (version, originalDirectory) => {
  let packageToInstall = 'react-scripts';

  const validSemver = semver.valid(version);
  if (validSemver) {
    packageToInstall += `@${validSemver}`;
  } else if (version) {
    if (version[0] === '@' && !version.includes('/')) {
      packageToInstall += version;
    } else if (version.match(/^file:/)) {
      packageToInstall = `file:${path.resolve(
        originalDirectory,
        version.match(/^file:(.*)?$/)[1],
      )}`;
    } else {
      // for tar.gz or alternative paths
      packageToInstall = version;
    }
  }

  const scriptsToWarn = [
    {
      name: 'react-scripts-ts',
      message: chalk.yellow(
        `The react-scripts-ts package is deprecated. TypeScript is now supported natively in Create React App. You can use the ${chalk.green(
          '--template typescript',
        )} option instead when generating your app to include TypeScript support. Would you like to continue using react-scripts-ts?`,
      ),
    },
  ];

  for (const script of scriptsToWarn) {
    if (packageToInstall.startsWith(script.name)) {
      return prompts({
        type: 'confirm',
        name: 'useScript',
        message: script.message,
        initial: false,
      }).then((answer) => {
        if (!answer.useScript) {
          process.exit(0);
        }

        return packageToInstall;
      });
    }
  }

  return Promise.resolve(packageToInstall);
};

const getTemplateInstallPackage = (template, originalDirectory) => {
  let templateToInstall = 'cra-template';
  if (template) {
    if (template.match(/^file:/)) {
      templateToInstall = `file:${path.resolve(
        originalDirectory,
        template.match(/^file:(.*)?$/)[1],
      )}`;
    } else if (
      template.includes('://') ||
      template.match(/^.+\.(tgz|tar\.gz)$/)
    ) {
      templateToInstall = template;
    } else {
      const packageMatch = template.match(
        /^(@[^/]+\/)?([^@]+)?(@.+)?$/,
      );
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
  const [packageToInstall, templateToInstall] = await Promise.all([
    getInstallPackage(scriptsVersion, originalDirectory),
    getTemplateInstallPackage(template, originalDirectory),
  ]);

  console.log(
    chalk.cyan(
      'Installing packages. This might take a couple of minutes.',
    ),
  );
};
