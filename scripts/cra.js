const fs = require('fs');
const path = require('path');

const { execSync } = require('child_process');

const cleanup = () => {
  console.log('Cleaning up.');
  execSync(`git checkout -- packages/*/package.json`);
};

const handleExit = () => {
  cleanup();
  console.log('Exiting without error.');
  process.exit();
};

const handleError = (e) => {
  console.error('ERROR! An error was encountered while executing');
  console.error(e);
  cleanup();
  console.log('Exiting with error.');
  process.exit(1);
};

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleError);

const gitStatus = execSync(`git status --porcelain`).toString();

if (gitStatus.trim().startsWith('packages')) {
  console.log('Please commit your changes before running this script!');
  console.log('Exiting because `git status` is not empty:');
  console.log();
  console.log(gitStatus);
  console.log();
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');
const packagePathsByName = {};

fs.readdirSync(packagesDir).forEach((name) => {
  const packageDir = path.join(packagesDir, name);
  const packageJson = path.join(packageDir, 'package.json');
  if (fs.existsSync(packageJson)) {
    packagePathsByName[name] = packageDir;
  }
});

Object.keys(packagePathsByName).forEach((name) => {
  const packageJson = path.join(
    packagePathsByName[name],
    'package.json',
  );
  const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  Object.keys(packagePathsByName).forEach((otherName) => {
    if (json.dependencies && json.dependencies[otherName]) {
      json.dependencies[otherName] =
        'file:' + packagePathsByName[otherName];
    }
    if (json.devDependencies && json.devDependencies[otherName]) {
      json.devDependencies[otherName] =
        'file:' + packagePathsByName[otherName];
    }
    if (json.peerDependencies && json.peerDependencies[otherName]) {
      json.peerDependencies[otherName] =
        'file:' + packagePathsByName[otherName];
    }
    if (
      json.optionalDependencies &&
      json.optionalDependencies[otherName]
    ) {
      json.optionalDependencies[otherName] =
        'file:' + packagePathsByName[otherName];
    }
  });

  fs.writeFileSync(packageJson, JSON.stringify(json, null, 2));
  console.log(
    'Replaced local dependencies in packages/' + name + '/package.json',
  );
});
console.log('Replaced all local dependencies for testing.');
console.log('Do not edit any package.json while this task is running.');

const scriptsFileName = execSync(`npm pack`, {
  cwd: path.join(packagesDir, 'react-scripts'),
})
  .toString()
  .trim();
const scriptsPath = path.join(
  packagesDir,
  'react-scripts',
  scriptsFileName,
);

// execSync('npm cache clean --force');

const args = process.argv.slice(2);

const craScriptPath = path.join(packagesDir, 'cra', 'index.js');

execSync(
  `node ${craScriptPath} ${args.join(
    ' ',
  )} --scripts-version="${scriptsPath}"`,
  {
    cwd: rootDir,
    stdio: 'inherit',
  },
);

// Cleanup
handleExit();
