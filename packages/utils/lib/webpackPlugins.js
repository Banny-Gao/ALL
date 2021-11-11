const path = require('path');
const os = require('os');
const chalk = require('chalk');
const findUp = require('find-up');

const escapeStringRegexp = require('escape-string-regexp');

class InlineChunkHtmlPlugin {
  constructor(htmlWebpackPlugin, tests) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.tests = tests;
  }

  getInlinedTag(publicPath, assets, tag) {
    if (
      tag.tagName !== 'script' ||
      !(tag.attributes && tag.attributes.src)
    )
      return tag;

    const scriptName = publicPath
      ? tag.attributes.src.replace(publicPath, '')
      : tag.attributes.src;

    if (!this.tests.some((test) => scriptName.match(test))) return tag;

    const asset = assets[scriptName];
    if (asset == null) return tag;

    return {
      tagName: 'script',
      innerHTML: asset.source(),
      closeTag: true,
    };
  }

  apply(compiler) {
    let publicPath = compiler.options.output.publicPath || '';
    if (publicPath && !publicPath.endsWith('/')) publicPath += '/';

    compiler.hooks.compilation.tap(
      'InlineChunkHtmlPlugin',
      (compilation) => {
        const tagFunction = (tag) =>
          this.getInlinedTag(publicPath, compilation.assets, tag);

        const hooks = this.htmlWebpackPlugin.getHooks(compilation);
        hooks.alterAssetTagGroups.tap(
          'InlineChunkHtmlPlugin',
          (assets) => {
            assets.headTags = assets.headTags.map(tagFunction);
            assets.bodyTags = assets.bodyTags.map(tagFunction);
          }
        );
      }
    );
  }
}

class InterpolateHtmlPlugin {
  constructor(htmlWebpackPlugin, replacements) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.replacements = replacements;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(
      'InterpolateHtmlPlugin',
      (compilation) => {
        this.htmlWebpackPlugin
          .getHooks(compilation)
          .afterTemplateExecution.tap(
            'InterpolateHtmlPlugin',
            (data) => {
              Object.keys(this.replacements).forEach((key) => {
                const value = this.replacements[key];
                data.html = data.html.replace(
                  new RegExp(`%${escapeStringRegexp(key)}%`, 'g'),
                  value
                );
              });
            }
          );
      }
    );
  }
}

class ModuleScopePlugin {
  constructor(appSrc, allowedFiles = []) {
    this.appSrc = Array.isArray(appSrc) ? appSrc : [appSrc];
    this.allowedFiles = new Set(allowedFiles);
    this.allowedPaths = [...allowedFiles]
      .map(path.dirname)
      .filter((p) => path.relative(p, process.cwd()) !== '');
  }

  apply(compiler) {
    const { appSrc, allowedFiles, allowedPaths } = this;
    compiler.hooks.file.tapAsync(
      'ModuleScopePlugin',
      (compilation, context, callback) => {
        if (!compilation.context.issuer) return callback();

        const { descriptionFileRoot } = compilation;
        const isNodeModulesRoot =
          ~descriptionFileRoot.indexOf('/node_modules/') ||
          ~descriptionFileRoot.indexOf('\\node_modules\\');

        if (isNodeModulesRoot || !compilation.__innerRequest_request)
          return callback();

        if (
          appSrc.every((src) => {
            const relative = path.relative(
              src,
              compilation.context.issuer
            );
            return (
              relative.startsWith('../') || relative.startsWith('..\\')
            );
          })
        )
          return callback();

        const compilationFullPath = path.resolve(
          path.dirname(compilation.context.issuer),
          compilation.__innerRequest_request
        );

        if (allowedFiles.has(compilationFullPath)) return callback();
        if (
          allowedPaths.some((allowedPath) =>
            compilationFullPath.startsWith(allowedPath)
          )
        )
          return callback();

        if (
          appSrc.every((src) => {
            const requestRelative = path.relative(
              src,
              compilationFullPath
            );
            return (
              requestRelative.startsWith('../') ||
              requestRelative.startsWith('..\\')
            );
          })
        ) {
          const scopeError = new Error(
            `${
              `You attempted to import ${chalk.cyan(
                compilation.__innerRequest_request
              )} which falls outside of the project ${chalk.cyan(
                'src/'
              )} directory. ` +
              `Relative imports outside of ${chalk.cyan(
                'src/'
              )} are not supported.`
            }${os.EOL}You can either move it inside ${chalk.cyan(
              'src/'
            )}, or add a symlink to it from project's ${chalk.cyan(
              'node_modules/'
            )}.`
          );
          Object.defineProperty(scopeError, '__module_scope_plugin', {
            value: true,
            writable: false,
            enumerable: false,
          });
          callback(scopeError, compilation);
        } else callback();
      }
    );
  }
}

class ModuleNotFoundPlugin {
  constructor(appPath) {
    this.appPath = appPath;

    this.useYarnCommand = this.useYarnCommand.bind(this);
    this.getRelativePath = this.getRelativePath.bind(this);
    this.prettierError = this.prettierError.bind(this);
  }

  useYarnCommand() {
    try {
      return findUp.sync('yarn.lock', { cwd: this.appPath }) != null;
    } catch (_) {
      return false;
    }
  }

  getRelativePath(_file) {
    let file = path.relative(this.appPath, _file);
    if (file.startsWith('..')) {
      file = _file;
    } else if (!file.startsWith('.')) {
      file = `.${path.sep}${file}`;
    }
    return file;
  }

  prettierError(err) {
    const { details: body = '', origin } = err;

    if (origin === null) {
      const caseSensitivity =
        err.message &&
        /\[CaseSensitivePathsPlugin\] `(.*?)` .* `(.*?)`/.exec(
          err.message
        );
      if (caseSensitivity) {
        const [, incorrectPath, actualName] = caseSensitivity;
        const actualFile = this.getRelativePath(
          path.join(path.dirname(incorrectPath), actualName)
        );
        const incorrectName = path.basename(incorrectPath);
        err.message = `Cannot find file: '${incorrectName}' does not match the corresponding name on disk: '${actualFile}'.`;
      }
      return err;
    }

    const file = this.getRelativePath(origin.resource);
    let details = body.split('\n');

    const request = /resolve '(.*?)' in '(.*?)'/.exec(details);
    if (request) {
      const isModule = details[1] && details[1].includes('module');
      const isFile = details[1] && details[1].includes('file');

      const [, target, context] = request;
      const relativeContext = this.getRelativePath(context);
      if (isModule) {
        const isYarn = this.useYarnCommand();
        details = [
          `Cannot find module: '${target}'. Make sure this package is installed.`,
          '',
          `You can install this package by running: ${
            isYarn
              ? chalk.bold(`yarn add ${target}`)
              : chalk.bold(`npm install ${target}`)
          }.`,
        ];
      } else if (isFile) {
        details = [
          `Cannot find file '${target}' in '${relativeContext}'.`,
        ];
      } else {
        details = [err.message];
      }
    } else {
      details = [err.message];
    }
    err.message = [file, ...details].join('\n').replace('Error: ', '');

    const isModuleScopePluginError =
      err.error && err.error.__module_scope_plugin;
    if (isModuleScopePluginError) {
      err.message = err.message.replace('Module not found: ', '');
    }
    return err;
  }

  apply(compiler) {
    const { prettierError } = this;
    compiler.hooks.make.intercept({
      register(tap) {
        if (
          !(
            tap.name === 'MultiEntryPlugin' ||
            tap.name === 'EntryPlugin'
          )
        ) {
          return tap;
        }
        return {
          ...tap,
          fn: (compilation, callback) => {
            tap.fn(compilation, (err, ...args) => {
              if (err && err.name === 'ModuleNotFoundError') {
                err = prettierError(err);
              }
              callback(err, ...args);
            });
          },
        };
      },
    });
    compiler.hooks.normalModuleFactory.tap(
      'ModuleNotFoundPlugin',
      (nmf) => {
        nmf.hooks.afterResolve.intercept({
          register(tap) {
            if (tap.name !== 'CaseSensitivePathsPlugin') {
              return tap;
            }
            return {
              ...tap,
              fn: (compilation, callback) => {
                tap.fn(compilation, (err, ...args) => {
                  if (
                    err &&
                    err.message &&
                    err.message.includes('CaseSensitivePathsPlugin')
                  ) {
                    err = prettierError(err);
                  }
                  callback(err, ...args);
                });
              },
            };
          },
        });
      }
    );
  }
}

module.exports = {
  InlineChunkHtmlPlugin,
  InterpolateHtmlPlugin,
  ModuleScopePlugin,
  ModuleNotFoundPlugin,
};
