process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

process.on('unhandledRejection', (err) => {
  throw err;
});

require('../config/env');

const fs = require('fs-extra');
const bfj = require('bfj');
const chalk = require('chalk');
const webpack = require('webpack');

const {
  checkRequiredFiles,
  formatWebpackMessages,
  checkBrowsers,
} = require('utils');

const paths = require('../config/paths');

const configFactory = require('../config/webpack.config');

const isInteractive = process.stdout.isTTY;

if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

const argv = process.argv.slice(2);
const writeStatsJson = argv.indexOf('--stats') !== -1;

const config = configFactory('production');

const build = () => {
  const compiler = webpack(config);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }

        let errMessage = err.message;

        if (Object.prototype.hasOwnProperty.call(err, 'postcssNode')) {
          errMessage +=
            '\nCompileError: Begins at CSS selector ' +
            err['postcssNode'].selector;
        }

        messages = formatWebpackMessages({
          errors: [errMessage],
          warnings: [],
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        );
      }

      if (messages.errors.length) {
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join('\n\n')));
      }

      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        const filteredWarnings = messages.warnings.filter(
          (w) => !/Failed to parse source map/.test(w)
        );
        if (filteredWarnings.length) {
          console.log(
            chalk.yellow(
              '\nTreating warnings as errors because process.env.CI = true.\n' +
                'Most CI servers set it automatically.\n'
            )
          );
          return reject(new Error(filteredWarnings.join('\n\n')));
        }
      }

      if (writeStatsJson) {
        return bfj
          .write(paths.appBuild + '/bundle-stats.json', stats.toJson())
          .then(resolve)
          .catch((error) => reject(new Error(error)));
      }

      return resolve();
    });
  });
};

checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    fs.emptyDirSync(paths.appBuild);

    fs.copySync(paths.appPublic, paths.appBuild, {
      dereference: true,
      filter: (file) => file !== paths.appHtml,
    });

    return build();
  })
  .then(
    () => {
      console.log(chalk.green('Compiled successfully.\n'));
    },
    (err) => {
      const tscCompileOnError =
        process.env.TSC_COMPILE_ON_ERROR === 'true';
      if (tscCompileOnError) {
        console.log(
          chalk.yellow(
            'Compiled with the following type errors (you may want to check these before deploying your app):\n'
          )
        );
        console.log(err);
      } else {
        console.log(chalk.red('Failed to compile.\n'));
        console.log(err);
        process.exit(1);
      }
    }
  );
