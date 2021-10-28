const address = require('address');
const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const chalk = require('chalk');
const detect = require('detect-port-alt');
const isRoot = require('is-root');
const prompts = require('prompts');

const { clearConsole, getProcessForPort } = require('./platform');

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
      // This can only return an IPv4 address
      lanUrlForConfig = address.ip();
      if (lanUrlForConfig) {
        // Check if the address is a private ip
        // https://en.wikipedia.org/wiki/Private_network#Private_IPv4_address_spaces
        if (
          /^10[.]|^172[.](1[6-9]|2[0-9]|3[0-1])[.]|^192[.]168[.]/.test(
            lanUrlForConfig,
          )
        ) {
          // Address is private, format it for later use
          lanUrlForTerminal = prettyPrintUrl(lanUrlForConfig);
        } else {
          // Address is not private, so we will discard it
          lanUrlForConfig = undefined;
        }
      }
    } catch (_e) {
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

module.exports = {
  formatWebpackMessages,
  prepareUrls,
};
