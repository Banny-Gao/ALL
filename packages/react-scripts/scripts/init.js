process.on('unhandledRejection', (err) => {
  throw err;
});

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const spawn = require('cross-spawn');
const os = require('os');

const { defaultBrowsers, tryGitInit } = require('utils');

module.exports = (
  root,
  appName,
  verbose,
  originalDirectory,
  templateName,
) => {
  const appPackage = require(path.join(root, 'package.json'));
  const useYarn = fs.existsSync(path.join(root, 'yarn.lock'));

  if (!templateName) {
    console.log('');
    console.error(
      `A template was not provided. This is likely because you're using an outdated version of ${chalk.cyan(
        'create-react-app',
      )}.`,
    );
    console.error(
      `Please note that global installs of ${chalk.cyan(
        'create-react-app',
      )} are no longer supported.`,
    );
    console.error(
      `You can fix this by running ${chalk.cyan(
        'npm uninstall -g create-react-app',
      )} or ${chalk.cyan(
        'yarn global remove create-react-app',
      )} before using ${chalk.cyan('create-react-app')} again.`,
    );
    return;
  }

  const templatePath = path.dirname(
    require.resolve(`${templateName}/package.json`, { paths: [root] }),
  );
  const templateJsonPath = path.join(templatePath, 'template.json');

  let templateJson = {};
  if (fs.existsSync(templateJsonPath))
    templateJson = require(templateJsonPath);

  const templatePackage = templateJson.package || {};
  const templatePackageBlacklist = [
    'name',
    'version',
    'description',
    'keywords',
    'bugs',
    'license',
    'author',
    'contributors',
    'files',
    'browser',
    'bin',
    'man',
    'directories',
    'repository',
    'peerDependencies',
    'bundledDependencies',
    'optionalDependencies',
    'engineStrict',
    'os',
    'cpu',
    'preferGlobal',
    'private',
    'publishConfig',
  ];
  const templatePackageToMerge = ['dependencies', 'scripts'];
  const templatePackageToReplace = Object.keys(templatePackage).filter(
    (key) => {
      return (
        !templatePackageBlacklist.includes(key) &&
        !templatePackageToMerge.includes(key)
      );
    },
  );

  const templateScripts = templatePackage.scripts || {};
  appPackage.scripts = Object.assign(
    {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test',
      eject: 'react-scripts eject',
    },
    templateScripts,
  );
  if (useYarn) {
    appPackage.scripts = Object.entries(appPackage.scripts).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value.replace(/(npm run |npm )/, 'yarn '),
      }),
      {},
    );
  }

  appPackage.eslintConfig = {
    extends: 'react-app',
  };
  appPackage.browserslist = defaultBrowsers;
  templatePackageToReplace.forEach((key) => {
    appPackage[key] = templatePackage[key];
  });

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(appPackage, null, 2) + os.EOL,
  );

  const readmeExists = fs.existsSync(path.join(root, 'README.md'));
  if (readmeExists) {
    fs.renameSync(
      path.join(root, 'README.md'),
      path.join(root, 'README.old.md'),
    );
  }
  if (useYarn) {
    try {
      const readme = fs.readFileSync(
        path.join(root, 'README.md'),
        'utf8',
      );
      fs.writeFileSync(
        path.join(root, 'README.md'),
        readme.replace(/(npm run |npm )/g, 'yarn '),
        'utf8',
      );
    } catch (err) {
      // Silencing the error. As it fall backs to using default npm commands.
    }
  }

  const templateDir = path.join(templatePath, 'template');
  if (fs.existsSync(templateDir)) {
    fs.copySync(templateDir, root);
  } else {
    console.error(
      `Could not locate supplied template: ${chalk.green(templateDir)}`,
    );
    return;
  }

  const gitignoreExists = fs.existsSync(path.join(root, '.gitignore'));
  if (gitignoreExists) {
    const data = fs.readFileSync(path.join(root, 'gitignore'));
    fs.appendFileSync(path.join(root, '.gitignore'), data);
    fs.unlinkSync(path.join(root, 'gitignore'));
  } else {
    fs.moveSync(
      path.join(root, 'gitignore'),
      path.join(root, '.gitignore'),
      [],
    );
  }

  let initializedGit = false;

  if (tryGitInit()) {
    initializedGit = true;
    console.log();
    console.log('Initialized a git repository.');
  }

  let command;
  let remove;
  let args;

  if (useYarn) {
    command = 'yarnpkg';
    remove = 'remove';
    args = ['add'];
  } else {
    command = 'npm';
    remove = 'uninstall';
    args = [
      'install',
      '--no-audit', // https://github.com/facebook/create-react-app/issues/11174
      '--save',
      verbose && '--verbose',
    ].filter((e) => e);
  }

  const dependenciesToInstall = Object.entries({
    ...templatePackage.dependencies,
    ...templatePackage.devDependencies,
  });
  if (dependenciesToInstall.length) {
    args = args.concat(
      dependenciesToInstall.map(([dependency, version]) => {
        return `${dependency}@${version}`;
      }),
    );
  }

  if (templateName && args.length > 1) {
    console.log();
    console.log(`Installing template dependencies using ${command}...`);

    const proc = spawn.sync(command, args, { stdio: 'inherit' });
    if (proc.status !== 0) {
      console.error(`\`${command} ${args.join(' ')}\` failed`);
      return;
    }
  }

  // Remove template
  console.log(`Removing template package using ${command}...`);
  console.log();
  const proc = spawn.sync(command, [remove, templateName], {
    stdio: 'inherit',
  });
  if (proc.status !== 0) {
    console.error(`\`${command} ${args.join(' ')}\` failed`);
    return;
  }

  let cdpath;
  if (
    originalDirectory &&
    path.join(originalDirectory, appName) === root
  ) {
    cdpath = appName;
  } else {
    cdpath = root;
  }
  const displayedCommand = useYarn ? 'yarn' : 'npm';

  console.log();
  console.log(`Success! Created ${appName} at ${root}`);
  console.log('Inside that directory, you can run several commands:');
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} start`));
  console.log('    Starts the development server.');
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}build`),
  );
  console.log('    Bundles the app into static files for production.');
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} test`));
  console.log('    Starts the test runner.');
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? '' : 'run '}eject`),
  );
  console.log(
    '    Removes this tool and copies build dependencies, configuration files',
  );
  console.log(
    '    and scripts into the app directory. If you do this, you can’t go back!',
  );
  console.log();
  console.log('We suggest that you begin by typing:');
  console.log();
  console.log(chalk.cyan('  cd'), cdpath);
  console.log(`  ${chalk.cyan(`${displayedCommand} start`)}`);
  if (readmeExists) {
    console.log();
    console.log(
      chalk.yellow(
        'You had a `README.md` file, we renamed it to `README.old.md`',
      ),
    );
  }
  console.log();
  console.log('Happy hacking!');
};
