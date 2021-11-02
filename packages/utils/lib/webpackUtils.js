/* eslint-disable no-console */
const address = require('address');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const chalk = require('chalk');
const detect = require('detect-port');
const prompts = require('prompts');
const forkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const loaderUtils = require('loader-utils');

const {
  clearConsole,
  getProcessForPort,
  isRoot,
  isUsingYarn,
} = require('./platform');

const friendlySyntaxErrorLabel = 'Syntax error:';

const isLikelyASyntaxError = (message) =>
  message.indexOf(friendlySyntaxErrorLabel) !== -1;

const formatMessage = (message) => {
  let lines = [];

  if (typeof message === 'string') {
    lines = message.split('\n');
  } else if ('message' in message) {
    lines = message.message.split('\n');
  } else if (Array.isArray(message)) {
    message.forEach((s) => {
      if ('message' in s) {
        lines = s.message.split('\n');
      }
    });
  }

  lines = lines.filter((line) => !/Module [A-z ]+\(from/.test(line));

  lines = lines.map((line) => {
    const parsingError =
      /Line (\d+):(?:(\d+):)?\s*Parsing error: (.+)$/.exec(line);
    if (!parsingError) {
      return line;
    }
    const [, errorLine, errorColumn, errorMessage] = parsingError;
    return `${friendlySyntaxErrorLabel} ${errorMessage} (${errorLine}:${errorColumn})`;
  });

  message = lines.join('\n');
  message = message.replace(
    /SyntaxError\s+\((\d+):(\d+)\)\s*(.+?)\n/g,
    `${friendlySyntaxErrorLabel} $3 ($1:$2)\n`,
  );

  message = message.replace(
    /^.*export '(.+?)' was not found in '(.+?)'.*$/gm,
    `Attempted import error: '$1' is not exported from '$2'.`,
  );
  message = message.replace(
    /^.*export 'default' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm,
    `Attempted import error: '$2' does not contain a default export (imported as '$1').`,
  );
  message = message.replace(
    /^.*export '(.+?)' \(imported as '(.+?)'\) was not found in '(.+?)'.*$/gm,
    `Attempted import error: '$1' is not exported from '$3' (imported as '$2').`,
  );
  lines = message.split('\n');

  if (lines.length > 2 && lines[1].trim() === '') lines.splice(1, 1);

  lines[0] = lines[0].replace(/^(.*) \d+:\d+-\d+$/, '$1');

  if (lines[1] && lines[1].indexOf('Module not found: ') === 0) {
    lines = [
      lines[0],
      lines[1]
        .replace('Error: ', '')
        .replace(
          'Module not found: Cannot find file:',
          'Cannot find file:',
        ),
    ];
  }

  if (lines[1] && lines[1].match(/Cannot find module.+sass/)) {
    lines[1] =
      'To import Sass files, you first need to install sass.\n';
    lines[1] +=
      'Run `npm install sass` or `yarn add sass` inside your workspace.';
  }

  message = lines.join('\n');

  message = message.replace(
    /^\s*at\s((?!webpack:).)*:\d+:\d+[\s)]*(\n|$)/gm,
    '',
  );
  message = message.replace(/^\s*at\s<anonymous>(\n|$)/gm, '');
  lines = message.split('\n');

  lines = lines.filter(
    (line, index, arr) =>
      index === 0 ||
      line.trim() !== '' ||
      line.trim() !== arr[index - 1].trim(),
  );

  message = lines.join('\n');
  return message.trim();
};

const formatWebpackMessages = (json) => {
  const formattedErrors = json.errors.map(formatMessage);
  const formattedWarnings = json.warnings.map(formatMessage);
  const result = {
    errors: formattedErrors,
    warnings: formattedWarnings,
  };
  if (result.errors.some(isLikelyASyntaxError)) {
    result.errors = result.errors.filter(isLikelyASyntaxError);
  }
  return result;
};

const isInteractive = process.stdout.isTTY;

const prepareUrls = (protocol, host, port, pathname = '/') => {
  const formatUrl = (hostname) =>
    url.format({
      protocol,
      hostname,
      port,
      pathname,
    });
  const prettyPrintUrl = (hostname) =>
    url.format({
      protocol,
      hostname,
      port: chalk.bold(port),
      pathname,
    });

  const isUnspecifiedHost = host === '0.0.0.0' || host === '::';
  let prettyHost;
  let lanUrlForConfig;
  let lanUrlForTerminal;
  if (isUnspecifiedHost) {
    prettyHost = 'localhost';
    try {
      lanUrlForConfig = address.ip();
      if (lanUrlForConfig) {
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanUrlForConfig,
          )
        ) {
          lanUrlForTerminal = prettyPrintUrl(lanUrlForConfig);
        } else {
          lanUrlForConfig = undefined;
        }
      }
    } catch {
      // ignored
    }
  } else {
    prettyHost = host;
  }

  const localUrlForTerminal = prettyPrintUrl(prettyHost);
  const localUrlForBrowser = formatUrl(prettyHost);
  return {
    lanUrlForConfig,
    lanUrlForTerminal,
    localUrlForTerminal,
    localUrlForBrowser,
  };
};

const printInstructions = (appName, urls) => {
  console.log();
  console.log(
    `You can now view ${chalk.bold(appName)} in the browser.`,
  );
  console.log();

  if (urls.lanUrlForTerminal) {
    console.log(
      `  ${chalk.bold('Local:')}            ${
        urls.localUrlForTerminal
      }`,
    );
    console.log(
      `  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`,
    );
  } else {
    console.log(`  ${urls.localUrlForTerminal}`);
  }

  console.log();
  console.log('Note that the development build is not optimized.');
  console.log(
    `To create a production build, use ` +
      `${chalk.cyan(`${isUsingYarn() ? 'yarn' : 'npm run'} build`)}.`,
  );
  console.log();
};

const createCompiler = (
  { appName, config, urls, useTypeScript, webpack },
  isPrintInstruction = true,
) => {
  let compiler;
  try {
    compiler = webpack(config);
  } catch (error) {
    console.log(chalk.red('Failed to compile.'));
    console.log();
    console.log(err.message || err);
    console.log();
    process.exit(1);
  }

  compiler.hooks.invalid.tap('invalid', () => {
    isInteractive && clearConsole();
    console.log(chalk.cyan('Compiling...'));
  });

  if (useTypeScript) {
    forkTsCheckerWebpackPlugin
      .getCompilerHooks(compiler)
      .waiting.tap('awaitingTypeScriptCheck', () => {
        console.log(
          chalk.yellow(
            'Files successfully emitted, waiting for typecheck results...',
          ),
        );
      });
  }

  let isFirstCompile = true;

  compiler.hooks.done.tap('done', async (stats) => {
    isInteractive && clearConsole();

    const statsData = stats.toJson({
      all: false,
      warnings: true,
      errors: true,
    });

    const messages = formatWebpackMessages(statsData);
    const isSuccessful =
      !messages.errors.length && !messages.warnings.length;

    isSuccessful && console.log(chalk.green('Compiled successfully!'));
    isSuccessful &&
      (isInteractive || isFirstCompile) &&
      isPrintInstruction &&
      printInstructions(appName, urls);

    isFirstCompile = false;

    if (messages.errors.length) {
      if (messages.errors.length > 1) {
        messages.errors.length = 1;
      }
      console.log(chalk.red('Failed to compile.\n'));
      console.log(messages.errors.join('\n\n'));
      return;
    }

    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.\n'));
      console.log(messages.warnings.join('\n\n'));

      console.log(
        `\nSearch for the ${chalk.underline(
          chalk.yellow('keywords'),
        )} to learn more about each warning.`,
      );
      console.log(
        `To ignore, add ${chalk.cyan(
          '// eslint-disable-next-line',
        )} to the line before.\n`,
      );
    }
  });

  return compiler;
};

const resolveLoopback = (proxy) => {
  const o = url.parse(proxy);
  o.host = undefined;

  if (o.hostname !== 'localhost') return proxy;

  try {
    if (!address.ip()) o.hostname = '127.0.0.1';
  } catch {
    o.hostname = '127.0.0.1';
  }

  return url.format(o);
};

const onProxyError = (proxy) => (err, req, res) => {
  const host = req.headers && req.headers.host;
  console.log(
    `${chalk.red('Proxy error:')} Could not proxy request ${chalk.cyan(
      req.url,
    )} from ${chalk.cyan(host)} to ${chalk.cyan(proxy)}.`,
  );
  console.log(
    `See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (${chalk.cyan(
      err.code,
    )}).`,
  );
  console.log();

  // And immediately send the proper error response to the client.
  // Otherwise, the request will eventually timeout with ERR_EMPTY_RESPONSE on the client side.
  if (res.writeHead && !res.headersSent) {
    res.writeHead(500);
  }
  res.end(
    `Proxy error: Could not proxy request ${req.url} from ${host} to ${proxy} (${err.code}).`,
  );
};

const prepareProxy = (proxy, appPublicFolder, servedPathname) => {
  if (!proxy) return;
  if (typeof proxy !== 'string') {
    console.log(
      chalk.red(
        'When specified, "proxy" in package.json must be a string.',
      ),
    );
    console.log(
      chalk.red(`Instead, the type of "proxy" was "${typeof proxy}".`),
    );
    console.log(
      chalk.red(
        'Either remove "proxy" from package.json, or make it a string.',
      ),
    );
    process.exit(1);
  }

  if (!/^http(s)?:\/\//.test(proxy)) {
    console.log(
      chalk.red(
        'When "proxy" is specified in package.json it must start with either http:// or https://',
      ),
    );
    process.exit(1);
  }

  const sockPath = process.env.WDS_SOCKET_PATH || '/ws';
  const isDefaultSockHost = !process.env.WDS_SOCKET_HOST;

  const mayProxy = (pathname) => {
    const maybePublicPath = path.resolve(
      appPublicFolder,
      pathname.replace(new RegExp(`^${servedPathname}`), ''),
    );
    const isPublicFileRequest = fs.existsSync(maybePublicPath);

    const isWdsEndpointRequest =
      isDefaultSockHost && pathname.startsWith(sockPath);
    return !(isPublicFileRequest || isWdsEndpointRequest);
  };

  let target;
  if (process.platform === 'win32') {
    target = resolveLoopback(proxy);
  } else {
    target = proxy;
  }

  return [
    {
      target,
      logLevel: 'silent',
      context: (pathname, req) =>
        req.method !== 'GET' ||
        (mayProxy(pathname) &&
          req.headers.accept &&
          req.headers.accept.indexOf('text/html') === -1),
      onProxyReq: (proxyReq) => {
        if (proxyReq.getHeader('origin')) {
          proxyReq.setHeader('origin', target);
        }
      },
      onError: onProxyError(target),
      secure: false,
      changeOrigin: true,
      ws: true,
      xfwd: true,
    },
  ];
};

const choosePort = async (host, defaultPort) => {
  try {
    const { port } = await detect(defaultPort, host);

    return await new Promise((resolve) => {
      if (port === defaultPort) {
        return resolve(port);
      }
      const message =
        process.platform !== 'win32' && defaultPort < 1024 && !isRoot()
          ? `Admin permissions are required to run a server on a port below 1024.`
          : `Something is already running on port ${defaultPort}.`;
      if (isInteractive) {
        clearConsole();
        const existingProcess = getProcessForPort(defaultPort);
        const question = {
          type: 'confirm',
          name: 'shouldChangePort',
          message: `${chalk.yellow(
            `${message}${
              existingProcess ? ` Probably:\n  ${existingProcess}` : ''
            }`,
          )}\n\nWould you like to run the app on another port instead?`,
          initial: true,
        };
        prompts(question).then((answer) => {
          if (answer.shouldChangePort) {
            resolve(port);
          } else {
            resolve(null);
          }
        });
      } else {
        console.log(chalk.red(message));
        resolve(null);
      }
    });
  } catch (err) {
    throw new Error(
      `${chalk.red(
        `Could not find an open port at ${chalk.bold(host)}.`,
      )}\n${`Network error message: ${err.message}` || err}\n`,
    );
  }
};

const getCSSModuleLocalIdent = (
  context,
  localIdentName,
  localName,
  options,
) => {
  const fileNameOrFolder = context.resourcePath.match(
    /index\.module\.(css|scss|sass)$/,
  )
    ? '[folder]'
    : '[name]';

  const hash = loaderUtils.getHashDigest(
    path.posix.relative(context.rootContext, context.resourcePath) +
      localName,
    'md5',
    'base64',
    5,
  );

  const className = loaderUtils.interpolateName(
    context,
    `${fileNameOrFolder}_${localName}__${hash}`,
    options,
  );

  return className.replace('.module_', '_').replace(/\./g, '_');
};

module.exports = {
  formatWebpackMessages,
  prepareUrls,
  createCompiler,
  prepareProxy,
  choosePort,
  getCSSModuleLocalIdent,
};
