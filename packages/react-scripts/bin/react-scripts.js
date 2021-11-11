#!/usr/bin/env node

process.on('unhandledRejection', (err) => {
  throw err;
});

const spawn = require('cross-spawn');

const scripts = ['build', 'eject', 'start', 'test'];
const args = process.argv.slice(2);
const scriptIndex = args.findIndex(scripts.includes.bind(scripts));

const script = ~scriptIndex ? args[scriptIndex] : args[0];
const nodeArgs = scriptIndex > 0 ? args.slice(0, scriptIndex) : [];

if (~scriptIndex) {
  // 该函数在子进程完全关闭之前不会返回
  const result = spawn.sync(
    process.execPath,
    [
      ...nodeArgs,
      require.resolve(`../scripts/${script}`),
      ...args.slice(scriptIndex + 1),
    ],
    { stdio: 'inherit' }
  );

  if (result.signal) process.exit(1);
  process.exit(result.status);
}
