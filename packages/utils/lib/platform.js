const spawn = require('cross-spawn');
const { execSync } = require('child_process');

const execOptions = {
  encoding: 'utf8',
  stdio: [
    'pipe', // stdin (default)
    'pipe', // stdout (default)
    'ignore', // stderr
  ],
};

const getNodeSemver = () => process.versions.node.split('.');

const isUsingYarn = () =>
  (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;

const executeNodeScript = ({ cwd, args }, data, source) =>
  new Promise((resolve, reject) => {
    spawn(
      process.execPath,
      [...args, '-e', source, '--', JSON.stringify(data)],
      { cwd, stdio: 'inherit' }
    ).on('close', (code) => {
      if (code !== 0) {
        reject({
          command: `node ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });

const clearConsole = () => {
  process.stdout.write(
    process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
  );
};

const getProcessIdOnPort = (port) =>
  execFileSync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], execOptions)
    .split('\n')[0]
    .trim();

const getDirectoryOfProcessById = (processId) =>
  execSync(
    `lsof -p ${processId} | awk '$4=="cwd" {for (i=9; i<=NF; i++) printf "%s ", $i}'`,
    execOptions
  ).trim();

const getProcessCommand = (processId) =>
  execSync(`ps -o command -p ${processId} | sed -n 2p`, execOptions).replace(
    /\n$/,
    ''
  );

const getProcessForPort = (port) => {
  try {
    const processId = getProcessIdOnPort(port);
    const directory = getDirectoryOfProcessById(processId);
    const command = getProcessCommand(processId);
    return (
      chalk.cyan(command) +
      chalk.grey(` (pid ${processId})\n`) +
      chalk.blue('  in ') +
      chalk.cyan(directory)
    );
  } catch (e) {
    return null;
  }
};

const isRoot = () => process.getuid && process.getuid() === 0;

module.exports = {
  getNodeSemver,
  isUsingYarn,
  executeNodeScript,
  clearConsole,
  getProcessIdOnPort,
  getDirectoryOfProcessById,
  getProcessCommand,
  getProcessForPort,
  isRoot,
};
