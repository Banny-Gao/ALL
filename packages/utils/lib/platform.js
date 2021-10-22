const spawn = require('cross-spawn');

const getNodeSemver = () => process.versions.node.split('.');

const isUsingYarn = () =>
  (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;

const executeNodeScript = ({ cwd, args }, data, source) =>
  new Promise((resolve, reject) => {
    spawn(
      process.execPath,
      [...args, '-e', source, '--', JSON.stringify(data)],
      { cwd, stdio: 'inherit' },
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

module.exports = {
  getNodeSemver,
  isUsingYarn,
  executeNodeScript,
};
